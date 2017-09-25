import matplotlib.pyplot as plt
import numpy as np
import scipy.io.wavfile
from scikits.talkbox.features import mfcc
import os
from sklearn import svm
from sklearn.naive_bayes import GaussianNB
import glob
from AudioML import AudioML

GENRE_DIR = "/Users/lucyzhang/Desktop/genres-project/genres"
genres=["blues", "country"]

class MFCCAnalysis(object):
	clf = svm.SVC(gamma=0.001, C=100.)

	def __init__(self, filename):
		self.filename = filename

	def performMFCC(self):
		sample_rate, X = scipy.io.wavfile.read(self.filename)
		X[X==0]=1
		ceps, mspec, spec = mfcc(X)
		self.write_ceps(ceps)
		plt.plot(ceps)
		#plt.show()
		plt.title(self.filename)
		plt.savefig(os.path.splitext(self.filename)[0]+".png")

	def write_ceps(self, ceps):
	    """
	    Write the MFCC to separate files to speed up processing.
	   	ceps: ndarray - Mel-cepstrum coefficients
	   	mspec: ndarray - Log-spectrum in the mel domain
	    """
	    print("write_ceps")
	    base_fn, ext = os.path.splitext(self.filename)
	    data_fn = base_fn + "_ceps"

	    # Save an array to a binary file in NumPy .npy format.
	    np.save(data_fn, ceps)
	    print "Written ", data_fn


	def read_ceps(self, genre_list=genres, base_dir=GENRE_DIR):
	    """
	        Reads the MFCC features from disk and
	        returns them in a numpy array.
	    """
	    X = []
	    y = []
	    for label, genre in enumerate(genre_list):
	        for fn in glob.glob(os.path.join(base_dir, genre, "*.ceps.npy")):
	        	#print fn
	        	ceps = np.load(fn)
	        	num_ceps = len(ceps)
	        	X.append(np.mean(ceps[int(num_ceps / 10):int(num_ceps * 9 / 10)], axis=0))
	        	y.append(label)
	    return np.array(X), np.array(y)



if __name__ == '__main__':
	mfccO = MFCCAnalysis('../static/uploads/stuff/Shelter.wav')
	#mfccO.performMFCC()
	data, genre_labels = mfccO.read_ceps()

	ml = AudioML()
	ml.trainGaussianNB(data, genre_labels)
	#print(x)
	#print(data[0])
