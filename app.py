from flask import Flask, render_template, request, send_from_directory, redirect, url_for, jsonify, session
import os
from werkzeug.utils import secure_filename
import FileSoundAnalyzer
import json
import specgram

app = Flask(__name__)
app.secret_key = os.urandom(12)


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = '/tmp/'#os.path.join(APP_ROOT, 'static/uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

app.config['ALLOWED_EXTENSIONS'] = set(['wav', 'mp3'])

# For a given file, return whether it's an allowed type or not
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']

@app.route("/")
def main():
	return render_template("index.html")
	#return "hi"


# Route that will process the file upload
@app.route('/upload', methods=['POST', 'GET'])
def upload():
    # Get the name of the uploaded file
    file = request.files['file']
    # Check if the file is one of the allowed types/extensions
    if file and allowed_file(file.filename):
        # Make the filename safe, remove unsupported chars
        filename = secure_filename(file.filename)
        # Move the file form the temporal folder to
        # the upload folder we setup
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        # Do all of the analysis on the music
        
        session['filename'] = filename
        #print data

        return render_template("musicpage.html", musicfile=str(url_for('uploaded_file',filename=filename)))
        #if data:
        #	return str(data)
        # Redirect the user to the uploaded_file route, which
        # will basicaly show on the browser the uploaded file
        #return redirect(url_for('uploaded_file',filename=filename))
    return "No allowed file"

# This route is expecting a parameter containing the name
# of a file. Then it will locate that file on the upload
# directory and show it on the browser, so if the user uploads
# an image, that image is going to be show after the upload
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)

@app.route('/getMusicData', methods=['GET'])
def getMusicData():
    filename = request.args.get('filename')
	#start_index = int(request.args.get('start'))
	#end_index = int(request.args.get('end'))  
    music = specgram.MusicNoteAnalyzer(filename)
    notes = music.generateGraphData()
    print(notes)
    sound = FileSoundAnalyzer.SoundAnalyzer(filename) 
    data = sound.process_file()['sound']['left']
    to_return = {'amplitude':data, 'notes':notes}
    #data = data[-100:]#data[start_index:end_index]
    return jsonify(to_return)


if __name__ == "__main__":
	port = int(os.environ.get("PORT", 5000))
	app.run(host='0.0.0.0', debug=True, port=port, threaded=True) 
