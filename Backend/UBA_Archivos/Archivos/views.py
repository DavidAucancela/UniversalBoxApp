import os
import pandas as pd
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Factura, DetalleFactura
from .serializers import FacturaSerializer, FacturaConDetallesSerializer

# Cargar un archivo Excel y procesar las facturas
class CargarFacturaExcelAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({"error": "Archivo no proporcionado"}, status=status.HTTP_400_BAD_REQUEST)

        # Guardar el archivo en el modelo Factura
        factura = Factura.objects.create(
            archivo=archivo,
            nombre=archivo.name,
            rutaAlmacenamiento=archivo.name,
            tamaño=archivo.size,
            estadoProcesamiento="PEN"  # Pendiente de procesamiento
        )

        try:
            # Leer el archivo Excel
            df = pd.read_excel(archivo)

            # Propagar los valores agrupadores hacia abajo si están en blanco  
            columnas_a_propagar = [
                'HAWB',
                'CONSIGNATARIO',
                'RUC - CEDULA',
                'PESO KG',
                'FACTURA COMERCIAL',
                'FECHA DE EMISIÓN',
            ]
            df[columnas_a_propagar] = df[columnas_a_propagar].fillna(method='ffill')

            for _, row in df.iterrows():
                detalle = DetalleFactura(
                    factura=factura,
                    consignatario=row.get('CONSIGNATARIO', ''),
                    ruc_cedula=row.get('RUC - CEDULA', ''),
                    peso_kg=row.get('PESO KG', 0),
                    valor_fob=row.get('VALOR FOB', 0),
                    descripcion=row.get('DESCRIPCIÓN', ''),
                    unidades_fisicas=row.get('UNIDADES FISICAS', ''),
                    factura_comercial=row.get('FACTURA COMERCIAL', ''),
                    fecha_emision=pd.to_datetime(row.get('FECHA DE EMISIÓN', ''), errors='coerce')
                )
                detalle.save()

            factura.estadoProcesamiento = "PAG"
            factura.save()

            return Response({"mensaje": "Archivo procesado correctamente"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            factura.estadoProcesamiento = "PEN"
            factura.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Detalle de una factura por ID
class FacturaDetailAPIView(generics.RetrieveAPIView):
    queryset = Factura.objects.all()
    serializer_class = FacturaConDetallesSerializer

# Listar todas las facturas
class FacturaListAPIView(generics.ListAPIView):
    queryset = Factura.objects.all().order_by('-fechasubida')
    serializer_class = FacturaSerializer

# Eliminar una factura por ID
class FacturaDeleteAPIView(APIView):
    def delete(self, request, pk, *args, **kwargs):
        try:
            factura = Factura.objects.get(pk=pk)
            factura.delete()
            return Response({"mensaje": "Factura eliminada correctamente"}, status=status.HTTP_204_NO_CONTENT)
        except Factura.DoesNotExist:
            return Response({"error": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND)
