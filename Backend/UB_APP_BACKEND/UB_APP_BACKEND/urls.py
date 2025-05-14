from django.contrib import admin
from django.urls import path, include
from ARCHIVOS import urls as archivos_url


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(archivos_url))
]
