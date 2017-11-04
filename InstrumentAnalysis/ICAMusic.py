from __future__ import unicode_literals
import sys
sys.path.append('../pyAudioAnalysis')

import audioBasicIO
import audioFeatureExtraction
from sklearn.decomposition import FastICA, PCA

import matplotlib.pyplot as plt

#------------
import numpy as np
from numpy import array
import wave
from mdp import fastica
from scikits.audiolab import wavread, wavwrite
from array import array


folder = "/Users/lucyzhang/Github/music-drawer-browser/static/uploads/"#"/Users/lucyzhang/Github/music-drawer-browser/pyAudioAnalysis/data/mono/"
songs = ["Heavy_mono.wav","sakura_mono.wav", "Shelter_mono.wav", "ZenZenZense_mono.wav"]
#4:40 = 240 + 40 = 280

def pad_audio(data, fs, T):
    # Calculate target number of samples
    N_tar = int(fs * T)
    # Calculate number of zero samples to append
    shape = data.shape
    # Create the target shape    
    N_pad = N_tar - shape[0]
    print("Padding with %s seconds of silence" % str(N_pad/fs) )
    shape = (N_pad,) + shape[1:]
    # Stack only if there is something to append    
    if shape[0] > 0:                
        if len(shape) > 1:
            return np.vstack((np.zeros(shape),
                              data))
        else:
            return np.hstack((np.zeros(shape),
                              data))
    else:
        return data

def mixSignals(file1, file2):
	sig1, fs1, enc1 = wavread(file1)
	sig2, fs2, enc2 = wavread(file2)
	sig2 = pad_audio(sig2, fs2, 280)
	sig1 = pad_audio(sig1, fs1, 280)
	mixed1 = sig1 + 0.5 * sig2
	mixed2 = sig2 + 0.6 * sig1
	wavwrite(np.array([mixed1, mixed2]).T, 'mixed1.wav', fs1, enc1)
	#wavwrite(mixed1, 'mixed1.wav', fs1, enc1)
	return (mixed1, mixed2)

def full_compute():
	# sig1, fs1, enc1 = wavread('source 1.wav')
	# sig2, fs2, enc2 = wavread('source 2.wav')
	# mixed1 = sig1 + 0.5 * sig2
	# mixed2 = sig2 + 0.6 * sig1

	# wavwrite(array([mixed1, mixed2]).T, 'mixed1.wav', fs1, enc1)
	 
	# Load in the stereo file
	recording, fs, enc = wavread('mixed1.wav')

	# Perform FastICA algorithm on the two channels
	sources = fastica(recording)

	# The output levels of this algorithm are arbitrary, so normalize them to 1.0.
	sources /= max(abs(sources), axis = 0)

	# Write back to a file
	wavwrite(sources, 'sources.wav', fs, enc)

def fastICA(filename):
	#recording = mixSignals(folder + "penguindrum.wav", folder + "Yuri.wav")
	recording, fs, enc = wavread(filename)
	sources = fastica(recording)
	#print sources
	print type(sources)
	print sources.shape
	plt.subplot(2,1,1)
	plt.plot(np.array(sources[:, 0]))
	plt.title('First compoment: Time domain of ' + filename)
	plt.xlabel('Time'); plt.ylabel('Amplitude'); 
	plt.subplot(2,1,2)
	plt.plot(np.array(sources[:, 1]))
	plt.title('Second compoment: Time domain of ' + filename)
	plt.xlabel('Time'); plt.ylabel('Amplitude'); 
	plt.show()
	#sources /= max(abs(sources), axis=0)
	#print sources
	wavwrite(sources, 'sources.wav', fs, enc)
	print "DONE"


def computeICA(filename):
	[Fs, X] = audioBasicIO.readAudioFile(filename)
	
	ica = FastICA(n_components=3)
	S = ica.fit_transform(X.reshape(-1, 1))
	A_ = ica.mixing_
	#pca = PCA(n_components = 3)
	#H = pca.fit_transform(X.reshape(-1, 1))
	plt.clf()
	plt.figure()
	models = [X, S]#, H]
	names = ['Original', 'ICA recovered', 'PCA recovered']
	colors = ['red', 'steelblue', 'orange']
	for ii, (model, name) in enumerate(zip(models, names), 1):
	    plt.subplot(4, 1, ii)
	    plt.title(name)
	    for sig, color in zip(model.T, colors):
	        plt.plot(sig, color=color)
	plt.show()


if __name__ == '__main__':
	computeICA(folder + "canon_short.wav")
	#mixSignals(folder + "penguindrum.wav", folder + "Yuri.wav")
	#full_compute()
	#fastICA(folder + "shigatsu_short.wav")
