from flask import Flask, render_template, request, send_from_directory, redirect, url_for, jsonify, session, json
import os
from werkzeug.utils import secure_filename
#import FileSoundAnalyzer
import json
#import specgram
#
from pyAudioAnalysis import audioBasicIO
from pyAudioAnalysis import audioFeatureExtraction
#import matplotlib.pyplot as plt
from pyAudioAnalysis import audioTrainTest as aT
from pyAudioAnalysis import audioFeatureExtraction as aF
from pyAudioAnalysis import NumpyEncoder

from pyAudioAnalysis import audioSegmentation as aS

import csv

# for faster communication
#from flask_socketio import SocketIO

app = Flask(__name__)
app.secret_key = os.urandom(12)
#socketio = SocketIO(app)

CHUNK_SECONDS = 5
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = '/tmp/'#os.path.join(APP_ROOT, 'static/uploads')
APP_DATA = os.path.join(APP_ROOT, 'pyAudioAnalysis/')
APP_STATIC = os.path.join(APP_ROOT, 'static')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

app.config['ALLOWED_EXTENSIONS'] = set(['wav'])

# For a given file, return whether it's an allowed type or not
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']

def classify_genre(filename, chunk_seconds = CHUNK_SECONDS):
    #print filename
    return aT.fileClassification(filename, os.path.join(APP_STATIC, 'models/svmMusicGenre3'),"svm", chunk_seconds)



def extract_other_features(filename):
    features = []
    chunk_data = audioBasicIO.readAudioFile(filename, CHUNK_SECONDS)
    for data in chunk_data:
        [Fs, x] = data
        F = audioFeatureExtraction.stFeatureExtraction(x, Fs, 0.050*Fs, 0.025*Fs);
        features.append(F)
        #rint F              # normalization
    return F

def set_default(obj):
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

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
        
        #session['filename'] = filename
        #print data
        [genre_data, features] = classify_genre(full_filename)
        [Result, P, classNames, MidTermFeatures] = classify_genre(full_filename, None)
        #print stFeatures

        #features = extract_other_features(full_filename).tolist()
        genre_dat = {}
        for i, name in enumerate(classNames):
           genre_dat[name] = P[i]


        #print type(MidTermFeatures)
        # Write single feature to CSV
        with open('music_features.csv', 'wb') as csvfile:
            wr = csv.writer(csvfile)
            wr.writerows([MidTermFeatures])

        speakers = aS.get_speakers('static/uploads/angel_beats_short.wav', relativePath = APP_DATA)

        return render_template("musicpage.html", speakers = json.dumps(speakers), genres = json.dumps(genre_data), single_genre = json.dumps(genre_dat), chunk_seconds = CHUNK_SECONDS,  musicfeatures = json.dumps(features), singleFeatures = json.dumps(MidTermFeatures), musicfile=str(url_for('uploaded_file',filename=filename)))

    return "No allowed file"

# This route is expecting a parameter containing the name
# of a file. Then it will locate that file on the upload
# directory and show it on the browser, so if the user uploads
# an image, that image is going to be show after the upload
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=True, port=port, threaded=True) 
