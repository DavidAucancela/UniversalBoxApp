from rest_framework import routers 
from ARCHIVOS import views
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r'facturas', views.FacturaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

