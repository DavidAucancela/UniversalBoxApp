from rest_framework import serializers
from .models import Factura, DetalleFactura

class DetalleFacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleFactura
        fields = '__all__'

class FacturaSerializer(serializers.ModelSerializer):
    detalles = DetalleFacturaSerializer(many=True, read_only=True)

    class Meta:
        model = Factura
        fields = '__all__'

class FacturaConDetallesSerializer(serializers.ModelSerializer):
    detalles = DetalleFacturaSerializer(many=True, read_only=True)

    class Meta:
        model = Factura
        fields = ['id', 'nombre', 'tamaño', 'estadoProcesamiento', 'fechasubida', 'detalles']