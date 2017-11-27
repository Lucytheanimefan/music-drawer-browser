import audioBasicIO
import audioFeatureExtraction
import matplotlib.pyplot as plt
import audioTrainTest as aT
import audioAnalysis as aA


plot = False
model = False
extractFeatures = False
readFile = True


genre_models = ["svmMusicGenre3", "svmMusicGenre6"]
songs = ["Heavy_mono.wav","sakura_mono.wav", "Shelter_mono.wav", "ZenZenZense_mono.wav"]

folder = " /Users/lucyzhang/Github/music-drawer-browser/pyAudioAnalysis/"



if readFile:
	song = "Shelter_mono_thumb1.wav"
	file_name = "data/mono/" + song
	aA.fileSpectrogramWrapper(file_name)
	#for song in songs:
	if extractFeatures:
		[Fs, x] = audioBasicIO.readAudioFile(file_name);
		F = audioFeatureExtraction.stFeatureExtraction(x, Fs, 0.050*Fs, 0.025*Fs);
		# if extractFeatures:
		# 	for data in chunked_data:
		# 		[Fs, x] = data
		# 		F = audioFeatureExtraction.stFeatureExtraction(x, Fs, 0.050*Fs, 0.025*Fs);
		# 		print "-----"
		# 		print F
		# ZCR: The rate of sign-changes of the signal during the duration of a particular frame.
		if plot:
			plt.subplot(2,2,1); plt.plot(F[0,:]); plt.xlabel('Frame no'); plt.ylabel('ZCR'); 
			plt.subplot(2,2,2); plt.plot(F[1,:]); plt.xlabel('Frame no'); plt.ylabel('Energy'); 
			plt.subplot(2,2,3); plt.plot(F[2,:]); plt.xlabel('Frame no'); plt.ylabel('Entropy of Energy');
			plt.subplot(2,2,4); plt.plot(F[3,:]); plt.xlabel('Frame no'); plt.ylabel('Spectral Centroid');
			plt.show()
			#plt.savefig("data/graphs/" + song + ".png")
			#plt.clf()

if model:
	for i, genre in enumerate(genre_models):
		print("--------------------")
		print(genre)
		print("--------")
		for song in songs:
			print("--------" + song + "-----------")
			data = aT.fileClassification("data/mono/" + song, "data/" + genre,"svm")
			print(song)
			print(data)


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