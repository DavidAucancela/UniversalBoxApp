import os
import pandas as pd
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Factura, DetalleFactura
from .serializers import FacturaSerializer, FacturaConDetallesSerializer, DetalleFacturaSerializer

class CargarFacturaExcelAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get('archivo')

        if not archivo:
            return Response({"error": "Archivo no proporcionado"}, status=status.HTTP_400_BAD_REQUEST)

        # Guardar archivo temporalmente
        factura_obj = Factura.objects.create(
            archivo=archivo,
            nombre=archivo.name,
            rutaAlmacenamiento=f"facturas_excel/{archivo.name}",
            tamaño=round(archivo.size / 1024, 2),  # Tamaño en KB
            estadoProcesamiento="PEN"  # Por defecto
        )

        try:
            df = pd.read_excel(archivo)

            # Renombrar columnas del Excel para que coincidan con el modelo
            df.rename(columns={
                'NOMBRES Y APELLIDOS': 'consignatario',
                'RUC - CEDULA': 'ruc_cedula',
                'PESO KG': 'peso_kg',
                'VALOR FOB': 'valor_fob',
                'DESCRIPCION': 'descripcion',
                'UNIDADES FISICAS': 'unidades_fisicas',
                'FACTURA COMERCIAL': 'factura_comercial',
                'FECHA DE EMISIÓN': 'fecha_emision',
            }, inplace=True)

            detalles = []
            for _, row in df.iterrows():
                detalle = DetalleFactura(
                    factura=factura_obj,
                    consignatario=row.get('consignatario', ''),
                    ruc_cedula=row.get('ruc_cedula', ''),
                    peso_kg=row.get('peso_kg', 0),
                    valor_fob=row.get('valor_fob', 0),
                    descripcion=row.get('descripcion', ''),
                    unidades_fisicas=row.get('unidades_fisicas', ''),
                    factura_comercial=row.get('factura_comercial', ''),
                    fecha_emision=row.get('fecha_emision')
                )
                detalle.save()
                detalles.append(DetalleFacturaSerializer(detalle).data)

            # Cambiar estado a procesado
            factura_obj.estadoProcesamiento = "PAG"
            factura_obj.save()

            return Response({
                "mensaje": "Archivo procesado correctamente",
                "factura": FacturaSerializer(factura_obj).data,
                "detalles_cargados": detalles
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            factura_obj.estadoProcesamiento = "PEN"
            factura_obj.save()
            return Response({"error": f"Error al procesar el archivo: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

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
            return Response({"mensaje": "Factura eliminada correctamente"}, status=204)
        except Factura.DoesNotExist:
            return Response({"error": "Factura no encontrada"}, status=404)