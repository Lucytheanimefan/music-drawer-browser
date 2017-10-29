import sys
sys.path.append('../pyAudioAnalysis')

import audioBasicIO
import audioFeatureExtraction
from sklearn.decomposition import FastICA, PCA

import matplotlib.pyplot as plt

#------------
import wave
from mdp import fastica
from scikits.audiolab import wavread, wavwrite


folder = "/Users/lucyzhang/Github/music-drawer-browser/static/uploads/"#"/Users/lucyzhang/Github/music-drawer-browser/pyAudioAnalysis/data/mono/"
songs = ["Heavy_mono.wav","sakura_mono.wav", "Shelter_mono.wav", "ZenZenZense_mono.wav"]

def fastICA(filename):
	recording, fs, enc = wavread(folder + filename)
	sources = fastica(recording)
	#print sources
	print len(sources)
	#sources /= max(abs(sources), axis=0)
	#print sources
	wavwrite(sources, 'sources.wav', fs, enc)
	print "DONE"


def computeICA(filename):
	[Fs, X] = audioBasicIO.readAudioFile(folder + filename)
	
	ica = FastICA(n_components=3)
	S = ica.fit_transform(X.reshape(-1, 1))
	A_ = ica.mixing_
	pca = PCA(n_components = 3)
	H = pca.fit_transform(X.reshape(-1, 1))
	plt.figure()
	models = [X, S, H]
	names = ['Original', 'ICA recovered', 'PCA recovered']
	colors = ['red', 'steelblue', 'orange']
	for ii, (model, name) in enumerate(zip(models, names), 1):
	    plt.subplot(4, 1, ii)
	    plt.title(name)
	    for sig, color in zip(model.T, colors):
	        plt.plot(sig, color=color)
	plt.show()


if __name__ == '__main__':
	#computeICA(songs[0])
	fastICA("penguindrum.wav")
