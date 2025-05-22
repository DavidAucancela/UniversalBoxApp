from django.contrib import admin
from django.urls import path, include

#from ARCHIVOS import urls as archivos_url
from AUTENTIFICACION import views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('AUTENTIFICACION.urls')),
#    path('', include(archivos_url))
    path('helloworld/', views.helloworld, name='helloworld'),
]
