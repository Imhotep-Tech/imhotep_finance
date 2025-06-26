from config import Config

# def a function to check if the file is form the allowed files that can be sent
def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    if "." in filename: #check if filename contains a dot
        filename_check = filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS #extract extension and check if allowed
        return filename_check #return true if extension is allowed
    else:
        return False #return false if no extension found

#a function that seperate the file extention form the filename by spliting it after the . and selects the index [1]
def file_ext(filename):
        """Extract the file extension from a filename."""
        if "." in filename: #check if filename contains a dot
                file_ext = filename.split('.', 1)[1].lower() #extract extension after first dot and convert to lowercase
        return file_ext #return file extension