import os
import requests
from config import Config

def save_profile_picture(picture_url, user_id):
    """Save user profile picture from Google OAuth to local storage."""
    try:
        if not os.path.exists(Config.UPLOAD_FOLDER_PHOTO): #check if upload folder exists
            os.makedirs(Config.UPLOAD_FOLDER_PHOTO) #create upload folder if it doesn't exist

        filename = f"{user_id}.jpg" #create filename using user id
        filepath = os.path.join(Config.UPLOAD_FOLDER_PHOTO, filename) #create full file path

        response = requests.get(picture_url) #download profile picture from google
        if response.status_code == 200: #check if download was successful
            with open(filepath, 'wb') as f: #open file for writing in binary mode
                f.write(response.content) #write image content to file
            return filename #return filename on success
        else:
            return None #return none if download failed

    except Exception: #catch any exceptions during the process
        return None #return none if an error occurred