import os
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse

router = APIRouter()


@router.get("/openapi.yaml", include_in_schema=False)
async def serve_openapi_yaml():
    spec_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "openapi.yaml")
    return FileResponse(spec_path, media_type="application/yaml")


@router.get("/docs", include_in_schema=False)
async def swagger_ui():
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\"utf-8\"/>
        <title>Swagger UI</title>
        <link rel=\"stylesheet\" href=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui.css\" />
      </head>
      <body>
        <div id=\"swagger-ui\"></div>
        <script src=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js\"></script>
        <script>
          window.ui = SwaggerUIBundle({
            url: '/openapi.yaml',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
          });
        </script>
      </body>
    </html>
    """
    return HTMLResponse(content=html)


@router.get("/redoc", include_in_schema=False)
async def redoc_ui():
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=\"utf-8\"/>
        <title>ReDoc</title>
        <script src=\"https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js\"></script>
      </head>
      <body>
        <redoc spec-url=\"/openapi.yaml\"></redoc>
      </body>
    </html>
    """
    return HTMLResponse(content=html)

