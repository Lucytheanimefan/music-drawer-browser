filename = 'pyAudioAnalysis/data/mono/Shelter_mono_thumb1.wav'

%'static/uploads/Sakura_short.wav'
[y, fs] = audioread(filename); % Read wave file
left=y(:,1); % Left channel 
%right=y(:,2); % Right channel
spectrogram(left)