# config.py
class Config:
    DEBUG = True
    SECRET_KEY = 'metodos_numericos_key'


class DevelopmentConfig(Config):
    pass


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}