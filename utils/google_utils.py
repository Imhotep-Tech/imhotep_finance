import os
import requests
from config import Config

def save_profile_picture(picture_url, user_id):
    try:
        if not os.path.exists(Config.UPLOAD_FOLDER_PHOTO):
            os.makedirs(Config.UPLOAD_FOLDER_PHOTO)

        filename = f"{user_id}.jpg"
        filepath = os.path.join(Config.UPLOAD_FOLDER_PHOTO, filename)

        response = requests.get(picture_url)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            return filename
        else:
            return None

    except Exception:
        return None