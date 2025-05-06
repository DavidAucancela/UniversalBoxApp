from django.db import models

class Factura(models.Model):
    PAG = "PAG"
    PEN = "PEN"

    CATEGORY_CHOICES = [
        (PAG, "Pagado"),
        (PEN, "Pendiente"),
    ]

    nombre = models.CharField(max_length=200)
    rutaAlmacenamiento = models.CharField(max_length=200)
    tamaño = models.DecimalField(max_digits=10, decimal_places=2)
    estadoProcesamiento = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    fechasubida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre
