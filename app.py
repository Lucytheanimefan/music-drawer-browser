from flask import Flask, render_template, request, send_from_directory, redirect, url_for, jsonify, session
import os
from werkzeug.utils import secure_filename
#import FileSoundAnalyzer
import json
#import specgram
#
from pyAudioAnalysis import audioBasicIO
from pyAudioAnalysis import audioFeatureExtraction
import matplotlib.pyplot as plt
from pyAudioAnalysis import audioTrainTest as aT

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

def classify_genre(filename):
    #print filename
    return aT.fileClassification(filename, "pyAudioAnalysis/data/svmMusicGenre3","svm")


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
        full_filename = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(full_filename)
        # Do all of the analysis on the music
        
        #session['filename'] = filename
        #print data
        Result, probs, classNames = classify_genre(full_filename)
        genre_data = {}
        for i, name in enumerate(classNames):
            genre_data[name] = probs[i]

        #print genre_data
        # preprocessing audio analysis

        return render_template("musicpage.html", genres = genre_data, musicfile=str(url_for('uploaded_file',filename=filename)))

    return "No allowed file"

# This route is expecting a parameter containing the name
# of a file. Then it will locate that file on the upload
# directory and show it on the browser, so if the user uploads
# an image, that image is going to be show after the upload
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)
'''
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
'''

if __name__ == "__main__":
	port = int(os.environ.get("PORT", 5000))
	app.run(host='0.0.0.0', debug=True, port=port, threaded=True) 
