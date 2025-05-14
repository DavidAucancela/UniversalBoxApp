from rest_framework import routers 
from AUTENTIFICACION import views
from django.urls import include, path

router = routers.DefaultRouter()
router.register(r'usuarios', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls))
]