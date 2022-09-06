import traceback

import sys
import os

SCRIPT_DIR = os.getcwd()
print('started in ', SCRIPT_DIR)

SD_UI_DIR = os.getenv('SD_UI_PATH', None)
sys.path.append(os.path.dirname(SD_UI_DIR))

OUTPUT_DIRNAME = "Stable Diffusion UI" # in the user's home folder

from fastapi import FastAPI, HTTPException
from starlette.responses import FileResponse
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

from sd_internal import Request, Response

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model_loaded = False
model_is_loading = False

modifiers_cache = None
outpath = os.path.join(os.path.expanduser("~"), OUTPUT_DIRNAME)

# defaults from https://huggingface.co/blog/stable_diffusion
class ImageRequest(BaseModel):
    prompt: str = ""
    init_image: str = None # base64
    mask: str = None # base64
    num_outputs: int = 1
    num_inference_steps: int = 50
    guidance_scale: float = 7.5
    width: int = 512
    height: int = 512
    seed: int = 42
    prompt_strength: float = 0.8
    # allow_nsfw: bool = False
    save_to_disk_path: str = None
    turbo: bool = True
    use_cpu: bool = False
    use_full_precision: bool = False

# @app.get('/')
# def read_root():
#     return FileResponse(os.path.join(SD_UI_DIR, 'index.html'))

@app.get('/')
def read_root():
    return FileResponse(os.path.join(SD_UI_DIR, 'frontend/dist/index.html'))

# then get the js files
@app.get('/index.js')
def read_scripts():
    return FileResponse(os.path.join(SD_UI_DIR, 'frontend/dist/index.js'))

#then get the css files
@app.get('/index.css')
def read_styles():
    return FileResponse(os.path.join(SD_UI_DIR, 'frontend/dist/index.css'))


@app.get('/ping')
async def ping():
    global model_loaded, model_is_loading

    try:
        if model_loaded:
            return {'OK'}

        if model_is_loading:
            return {'ERROR'}

        model_is_loading = True

        from sd_internal import runtime
        runtime.load_model(ckpt_to_use="sd-v1-4.ckpt")

        model_loaded = True
        model_is_loading = False

        return {'OK'}
    except Exception as e:
        print(traceback.format_exc())
        return HTTPException(status_code=500, detail=str(e))

@app.post('/image')
async def image(req : ImageRequest):
    from sd_internal import runtime

    r = Request()
    r.prompt = req.prompt
    r.init_image = req.init_image
    r.mask = req.mask
    r.num_outputs = req.num_outputs
    r.num_inference_steps = req.num_inference_steps
    r.guidance_scale = req.guidance_scale
    r.width = req.width
    r.height = req.height
    r.seed = req.seed
    r.prompt_strength = req.prompt_strength
    # r.allow_nsfw = req.allow_nsfw
    r.turbo = req.turbo
    r.use_cpu = req.use_cpu
    r.use_full_precision = req.use_full_precision
    r.save_to_disk_path = req.save_to_disk_path

    try:
        res: Response = runtime.mk_img(r)

        return res.json()
    except Exception as e:
        print(traceback.format_exc())
        return HTTPException(status_code=500, detail=str(e))

@app.get('/media/ding.mp3')
def read_ding():
    return FileResponse(os.path.join(SD_UI_DIR, 'media/ding.mp3'))

@app.get('/media/kofi.png')
def read_modifiers():
    return FileResponse(os.path.join(SD_UI_DIR, 'media/kofi.png'))

@app.get('/modifiers.json')
def read_modifiers():
    return FileResponse(os.path.join(SD_UI_DIR, 'modifiers.json'))

@app.get('/output_dir')
def read_home_dir():
    return {outpath}

# start the browser ui
import webbrowser; webbrowser.open('http://localhost:9000')
