from django.urls import path
from .views import CargarFacturaExcelAPIView, FacturaListAPIView, FacturaDeleteAPIView, FacturaDetailAPIView


urlpatterns = [
    path('archivo/cargar/', CargarFacturaExcelAPIView.as_view(), name='cargar_factura'),
    path('archivo/listar/', FacturaListAPIView.as_view(), name='listar_facturas'),
    path('archivo/listar/<int:pk>/', FacturaDetailAPIView.as_view(), name='listar_una_factura'),
    path('archivo/eliminar/<int:pk>/', FacturaDeleteAPIView.as_view(), name='eliminar_factura'),

]
