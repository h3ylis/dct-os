from flask import Blueprint

from .projects import bp as projects_bp
from .cost_codes import bp as cost_codes_bp
from .resources import bp as resources_bp
from .dockets import bp as dockets_bp

api = Blueprint("api", __name__, url_prefix="/api")

api.register_blueprint(projects_bp)
api.register_blueprint(cost_codes_bp)
api.register_blueprint(resources_bp)
api.register_blueprint(dockets_bp)
