from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('AUTENTIFICACION.urls')),
    path('archivos/', include('ARCHIVOS.urls')),

]
