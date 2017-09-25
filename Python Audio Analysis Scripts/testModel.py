from mfccplot import MFCCAnalysis
from sklearn.externals import joblib

class AudioMLTest(object):

	def __init__(self, labels):
		self.mfcc = MFCCAnalysis()
		self.labels = labels

	def test_model_on_single_file(self, filename):
	    clf = joblib.load('models/audio_model.pkl')
	    print("Loaded model")
	    X, y = self.mfcc.read_ceps_test(filename)
	    probs = clf.predict(X)
	    print "-----------RESULTS------------"
	    predicted_genre = self.labels[probs[0]]
	    # probs=probs[0]
	    # max_prob = max(probs)
	    # for i,j in enumerate(probs):
	    #     if probs[i] == max_prob:
	    #         max_prob_index=i
	    
	    # print max_prob_index
	    # predicted_genre = self.labels[max_prob_index]
	    print "predicted genre = ",predicted_genre
	    return predicted_genre

if __name__ == "__main__":
	test_file = "/Users/lucyzhang/Desktop/genres-project/genres/metal/metal.00003.wav"#"/Users/lucyzhang/Github/music-drawer-browser/static/uploads/Stuff/Heavy.wav"
	test = AudioMLTest(["metal", "pop"])
	# should predict genre as "pop" because this is def not metal
	predicted_genre = test.test_model_on_single_file(test_file)