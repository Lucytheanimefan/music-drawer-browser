import pyaudio
import numpy as np
import pylab
import time

RATE = 44100
CHUNK = 2048#int(RATE/2) # RATE / number of updates per second

def soundplot(stream):
    t1=time.time()
    data = np.fromstring(stream.read(CHUNK),dtype=np.int16)
    pylab.plot(data)
    pylab.title(i)
    pylab.grid()
    pylab.axis([0,len(data),-2**16/2,2**16/2])
    pylab.savefig("03.png",dpi=50)
    pylab.close('all')
    print("took %.02f ms"%((time.time()-t1)*1000))

if __name__=="__main__":
    p=pyaudio.PyAudio()
    stream=p.open(format=pyaudio.paInt16,channels=1,rate=RATE,input=True,
                  frames_per_buffer=CHUNK)
    i = 0
    while True: #do this for 10 seconds
    	print("----- Start soundplot --------")
    	i += 1
        soundplot(stream)
        time.sleep(5.5)

    print("Stop stream")
    stream.stop_stream()
    stream.close()
    p.terminate()