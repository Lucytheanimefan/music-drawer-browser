import audioBasicIO
import audioFeatureExtraction
import matplotlib.pyplot as plt
import audioTrainTest as aT


plot = False
model = True
extractFeatures = False
readFile = False

genre_models = ["svmMusicGenre3", "svmMusicGenre6"]
songs = ["Heavy_mono.wav","sakura_mono.wav", "Shelter_mono.wav", "ZenZenZense_mono.wav"]

folder = " /Users/lucyzhang/Github/music-drawer-browser/pyAudioAnalysis/"

if readFile:
	for song in songs:
		chunked_data = audioBasicIO.readAudioFile("data/mono/" + song, 30);
		if extractFeatures:
			for data in chunked_data:
				[Fs, x] = data
				F = audioFeatureExtraction.stFeatureExtraction(x, Fs, 0.050*Fs, 0.025*Fs);
				print F
		# ZCR: The rate of sign-changes of the signal during the duration of a particular frame.
		if plot:
			plt.subplot(2,2,1); plt.plot(F[0,:]); plt.xlabel('Frame no'); plt.ylabel('ZCR'); 
			plt.subplot(2,2,2); plt.plot(F[1,:]); plt.xlabel('Frame no'); plt.ylabel('Energy'); 
			plt.subplot(2,2,3); plt.plot(F[2,:]); plt.xlabel('Frame no'); plt.ylabel('Entropy of Energy');
			plt.subplot(2,2,4); plt.plot(F[3,:]); plt.xlabel('Frame no'); plt.ylabel('Spectral Centroid');
			#plt.show()
			plt.savefig("data/graphs/" + song + ".png")
			plt.clf()

if model:
	for i, genre in enumerate(genre_models):
		print("--------------------")
		print(genre)
		print("--------")
		for song in songs:
			print("--------" + song + "-----------")
			data = aT.fileClassification("data/mono/" + song, "data/" + genre,"svm", 30)
			#print(song)
			#print(P)
			#print(classNames)


# print "svmMusicGenre 1"
# Result, P, classNames = aT.fileClassification("data/Heavy.wav", "data/svmMusicGenre3","svm")
# print "Heavy.wav"
# print P
# print classNames

# Result, P, classNames = aT.fileClassification("data/Sakura.wav", "data/svmMusicGenre3","svm")
# print "Sakura.wav"
# print P
# print classNames


# Result, P, classNames = aT.fileClassification("data/Shelter.wav", "data/svmMusicGenre3","svm")
# print "Shelter.wav"
# print P
# print classNames