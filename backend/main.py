
try:
    from fastapi import FastAPI
except ModuleNotFoundError:
    # Allow the module to be imported in environments without FastAPI installed.
    class FastAPI:
        def get(self, path):
            def decorator(func):
                return func

            return decorator

        def __call__(self, *args, **kwargs):
            return self

app = FastAPI()

@app.get("/")
def hello_world():
    return {"message": "Hello World"}