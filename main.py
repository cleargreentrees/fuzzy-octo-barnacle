import requests
import time
import pyaudio
import wave
import os

def get_url(freq):
  # This function returns the url for the kiwisdr with the given frequency
  base_url = "http://73.45.156.230:8073/"
  return base_url + "?f=" + str(freq) + "am"

def get_stream(url):
  # This function returns the audio stream from the kiwisdr using pyaudio
  p = pyaudio.PyAudio()
  stream = p.open(format=pyaudio.paInt16, channels=1, rate=12000, input=True, frames_per_buffer=1024)
  return stream

def record_stream(stream):
  # This function records 15 seconds of audio from the stream using pyaudio and saves it as a wav file
  p = pyaudio.PyAudio()
  frames = []
  for i in range(0, int(12000 / 1024 * 15)):
    data = stream.read(1024)
    frames.append(data)
  stream.stop_stream()
  stream.close()
  p.terminate()
  file_name = "recording_" + time.strftime("%Y%m%d-%H%M%S") + ".wav"
  wf = wave.open(file_name, "wb")
  wf.setnchannels(1)
  wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
  wf.setframerate(12000)
  wf.writeframes(b"".join(frames))
  wf.close()
  return file_name

def send_file(file_name):
  # This function sends the wav file to a discord channel using requests and a discord webhook url
  webhook_url = os.getenv('HookUrl')
  files = {"file": open(file_name, "rb")}
  requests.post(webhook_url, files=files)

# Main part of the script
print("Script started")
while True:
  url = get_url(1000)
  stream = get_stream(url)
  file_name = record_stream(stream)
  send_file(file_name)
  print("Recording done")
  time.sleep(60) # Wait for one minute before repeating
