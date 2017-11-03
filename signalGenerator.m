filename = 'static/uploads/signal.wav'
Fsampling=44100;%frequency sampling = 44100Hz 
duration=10;%tone duration = 1s

midC = 262
Ftone1=87%F%100%440;%sound1 frequency = 440Hz % This is the one that's being detected all the time 
Ftone2=123%B %1320;%sound1 frequency = 500Hz
n = [1:Fsampling*duration];
y = sin(n*2*pi*midC/Fsampling);
left=sin(n*2*pi*Ftone1/Fsampling) + y;%generate sound1 for 1s 
right=sin(n*2*pi*Ftone2/Fsampling) + y;%generate sound1 for 1s
stereosnd = [left; right];
stereosnd = stereosnd';
f = abs(fft(stereosnd));
subplot(2,1,1);
plot(stereosnd);
subplot(2,1,2);
plot(f);
soundsc(stereosnd, Fsampling);
audiowrite(filename, stereosnd, Fsampling)