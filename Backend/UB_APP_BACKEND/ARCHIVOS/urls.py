from django.urls import path
from .views import CargarFacturaExcelAPIView, FacturaListAPIView, FacturaDeleteAPIView, FacturaDetailAPIView


urlpatterns = [
    path('cargar/', CargarFacturaExcelAPIView.as_view(), name='cargar_factura'),
    path('listar/', FacturaListAPIView.as_view(), name='listar_facturas'),
    path('listar/<int:pk>/', FacturaDetailAPIView.as_view(), name='listar_una_factura'),
    path('eliminar/<int:pk>/', FacturaDeleteAPIView.as_view(), name='eliminar_factura'),

]
