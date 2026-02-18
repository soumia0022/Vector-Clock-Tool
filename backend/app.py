from flask import Flask
from flask_cors import CORS

from routes.health import bp as health_bp
from routes.processes import bp as processes_bp
from routes.events import bp as events_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(processes_bp)
    app.register_blueprint(events_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)