import matplotlib.pyplot as plt
import numpy as np
import scipy.io.wavfile
from scikits.talkbox.features import mfcc
import os

class MFCCAnalysis(object):
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
	    data_fn = base_fn + ".ceps"
	    np.save(data_fn, ceps)
	    print "Written ", data_fn


if __name__ == '__main__':
	mfccO = MFCCAnalysis('../static/uploads/Shelter.wav')
	mfccO.performMFCC()
