from __future__ import division
import scipy.io.wavfile as wavfile
import numpy as np
import matplotlib.pyplot as plt
import xlrd
import pandas as pd
#import seaborn
from scipy.signal import argrelextrema
from scipy.interpolate import interp1d
#import abjad
import re

NoteFile = pd.read_excel('NoteFreq.xlsx',0)
#staff = abjad.Staff()

debug = True

def fixNotes(letters):

    m = letters

    if m[-1]=='0':
        #note = m[0].upper()+ m[0].upper()+ m[0].upper()
        note = m[0]+3*','

    if m[-1]=='1':
        #note = m[0].upper()+ m[0].upper()
        note = m[0]+2*','

    if m[-1]=='2':
        note = m[0]+','

    if m[-1]=='3':
        note = m[0]

    if m[-1]=='4':
        note = m[0]+"'"

    if m[-1]=='5':
        note = m[0]+2*"'"

    if m[-1]=='6':
        note = m[0]+3*"'"

    if m[-1]=='7':
        note = m[0]+4*"'"

    if m[-1]=='8':
        note = m[0]+5*"'"

    if m[-1]=='9':
        note = m[0]+6*"'"

    if m[-1]=='10':
        note = m[0]+7*"'"

    if m[1]=='s':
        fixed = note
        fixed = fixed[:1]+'s'+fixed[1:]
    else:
        fixed = note

    return fixed

class MusicNoteAnalyzer(object):
    def __init__(self, filename):
        self.filename = filename
        self.rate, self.data = wavfile.read(self.filename)
        #print self.rate
        #print self.data[22100]

    def generateGraphData(self):
        if debug:
            print(self.data)
        time = np.arange(len(self.data[:,0]))*1.0/self.rate
        nfft = 1024*6
        pxx, freq, bins, plot = plt.specgram(self.data[:,0],NFFT=nfft,noverlap=32, Fs=2,
                     interpolation='bilinear')

        # Another plot
        #plt.show()
        plt.savefig('specgramShelter.png')
        a = np.mean(pxx,axis=0)
        aa = np.arange(len(a))
        a = a/np.max(a)*np.max(self.data[:,0])
        aa = aa/np.max(aa) * time[-1]

        f = interp1d(aa,a)
        newSmooth = f(time)

        indMax = argrelextrema(newSmooth, np.greater)[0]
        indMin = argrelextrema(newSmooth, np.less)[0]

        lastValue = np.where(newSmooth==newSmooth[-1])[0]
        indMin = np.hstack((indMin,lastValue))

        # A plot
        # plt.plot(time,self.data[:,0])
        # plt.plot(aa,a)
        # plt.plot(time[indMax],newSmooth[indMax])
        # plt.plot(time[indMin],newSmooth[indMin])
        #plt.show()
        #plt.savefig('specgram2.png')

        notes = np.array([indMax,indMin]).T
        letterNotes, freqs, individualNotes = self.getFreq(notes, self.data)

        if debug:
            print("Letter notes: ")
            print(letterNotes)

        result = []
        # Format the notes
        for i,v in enumerate(letterNotes):
            #print v
            letters = letterNotes[i].encode('ASCII').lower()
            try:
                fixed = fixNotes(letters)
                result.append(fixed)
            except UnboundLocalError:
                m = re.search('\w.\d',letters)
                shortenedNote = m.group(0)
                newNote = shortenedNote[0]+'s'+shortenedNote[-1]
                fixed = fixNotes(newNote)
                #print fixed
                result.append(fixed)
                pass

        print "Result:"
        return result


    def getHarmonics(self,p,f,maxPower,maxFrequency,harmonics,harm):
        x = maxFrequency/harm
        #problem is that its not exactly in f
        ind1 = np.where(f<=x+1)
        ind2 = np.where(f>=x-1)
        mask = np.in1d(ind1,ind2)
        index = np.where(mask == True)[0]

        #print 'frequency'
        #print f[index]
        condition = p[index]/maxPower
        try:
            condition = condition[0]
        except IndexError:
            pass

        #if p[index]/maxPower>=0.90:
        if condition>=0.90:
            harmonics.append(f[index][0])

        return harmonics

    def getFreq(self, notes, data):
        individualNotes = []
        freqs = []
        letterNotes = []

        for i,v in enumerate(notes):

            individualNotes.append(data[v[0]:v[1],0])

            p = 20*np.log10(np.abs(np.fft.rfft(data[v[0]:v[1], 0])))
            f = np.linspace(0, self.rate/2.0, len(p))

            harmonics = []
            maxPower = np.max(p)
            maxFrequency = f[np.where(p==max(p))][0]

            for j in range(2,8):
                harmonics = self.getHarmonics(p,f,maxPower,maxFrequency,harmonics,j)

            if harmonics==[]:
                harmonics = [maxFrequency]

            #print 'HARMONICS'
            #print harmonics

    #        maxFFT = np.where(p==np.max(p))
    #        maxFreq = f[maxFFT]
    #        freqs.append(maxFreq)
            maxFreq = harmonics
            print 'maxFreq: ' + str(i)
            print maxFreq
    #        q = NoteFile['Lower']<maxFreq[0]
    #        r = NoteFile['Upper']>maxFreq[0]
    #        note = np.in1d(q,r)


            a = NoteFile[NoteFile['Lower']<maxFreq[0]]
            b = NoteFile[NoteFile['Upper']>maxFreq[0]]
            note = a.join(b,how='inner',lsuffix='Lower').index[0]

            letterNotes.append(note)

        return letterNotes, maxFreq, individualNotes

if __name__ == '__main__':
    music = MusicNoteAnalyzer('../static/uploads/signal.wav')
    print music.generateGraphData()


