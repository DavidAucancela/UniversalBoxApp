from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# BaseManager: metodo para crear usuarios y superusuarios.
class UsuarioManager(BaseUserManager):
    def create_user(self, correo, hashContraseña=None, **extra_fields):
        if not correo:
            raise ValueError('El correo es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(hashContraseña)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, hashContraseña, **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        return self.create_user(correo, hashContraseña, **extra_fields)

# MODELO ROL
class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre

# MODELO USUARIO
class Usuario(AbstractBaseUser, PermissionsMixin):
    idUsuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    estado = models.BooleanField(default=True)
    fechaRegistro = models.DateTimeField(auto_now_add=True)
    ultimoAcceso = models.TimeField(null=True, blank=True)

    roles = models.ManyToManyField(Rol, related_name='usuarios')

    # Campos requeridos por Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre', 'apellido']

    def __str__(self):
        return self.correo