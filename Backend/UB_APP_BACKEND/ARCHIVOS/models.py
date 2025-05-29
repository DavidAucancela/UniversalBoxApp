from django.db import models

class Factura(models.Model):
    PAG = "PAG"
    PEN = "PEN"
    CATEGORY_CHOICES = [
        (PAG, "Pagado"),
        (PEN, "Pendiente"),
    ]
    
    archivo = models.FileField(upload_to='facturas_excel/', null=True, blank=True)
    nombre = models.CharField(max_length=200)
    rutaAlmacenamiento = models.CharField(max_length=200)
    tamaño = models.DecimalField(max_digits=10, decimal_places=2)
    estadoProcesamiento = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    fechasubida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre
    
class DetalleFactura(models.Model):
    # Relación con la factura principal
    factura = models.ForeignKey('Factura', related_name='detalles', on_delete=models.CASCADE)

    # Datos del comprador
    consignatario = models.CharField("Nombres y Apellidos", max_length=200)
    ruc_cedula = models.CharField("RUC / Cédula", max_length=20)

    # Información de la compra
    peso_kg = models.DecimalField("Peso (kg)", max_digits=10, decimal_places=2)
    valor_fob = models.DecimalField("Valor USD", max_digits=10, decimal_places=2)
    descripcion = models.TextField("Descripción del Producto", max_length=500, null=True, blank=True)
    unidades_fisicas = models.CharField("Unidades", max_length=50, null=True, blank=True)

    # Información de la factura
    factura_comercial = models.CharField("Factura Comercial", max_length=200, null=True, blank=True)
    fecha_emision = models.DateField("Fecha de Emisión")

    # Control
    fecha_subida = models.DateTimeField("Fecha de Subida", auto_now_add=True)

    def __str__(self):
        return f"{self.consignatario} - {self.unidades_fisicas} unidades - Factura {self.factura.id}"