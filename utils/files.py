from config import Config

# def a function to check if the file is form the allowed files that can be sent
def allowed_file(filename):
    if "." in filename:
        filename_check = filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
        return filename_check
    else:
        return False

#a function that seperate the file extention form the filename by spliting it after the . and selects the index [1]
def file_ext(filename):
        if "." in filename:
                file_ext = filename.split('.', 1)[1].lower()
        return file_ext