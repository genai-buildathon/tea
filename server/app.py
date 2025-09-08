import fastapi

app = fastapi.FastAPI()

@app.get("/hgealth")
async def health():
    return {"Status": "UP"}


# @app.get("/")