from django.urls import path, include
from .views import UserViewSet, RolViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)
router.register(r'roles', RolViewSet)

urlpatterns = [
    path('', include(router.urls)),
]