// import logo from './logo.svg';
import { useEffect, useRef, useState, useCallback } from 'react'
import * as bodyPix from '@tensorflow-models/body-pix'

import './App.css';
import { poses, emojs } from './ options'

let net = null

function App() {
  const video = useRef(null)
  const canvas = useRef(null)
  const [{ part, netLoaded, devices, emo }, setState] = useState({ part: poses[0], netLoaded: false, devices: [], deviceIndex: 0, emo: emojs[0] })

  let timer;
  const load = (e) => {
    console.log('load')
    const ctx = canvas.current.getContext('2d')
    timer = setInterval(async () => {
      try {
        const { allPoses: [points] } = await net.segmentPersonParts(video.current);
        const facePart = points.keypoints.find(point => point.part === part)
        ctx.drawImage(video.current, 0, 0, 320, 240);
        ctx.fillText(emo, facePart.position.x - 6, facePart.position.y + 4, 8)
      } catch (error) {
        console.log(error)
      }
    }, 1000 / 30)

  }

  async function playVideo(deviceId) {
    console.log(deviceId)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { exact: deviceId } });
      console.log(stream)
      /* use the stream */

      video.current.srcObject = stream;
      video.current.onloadedmetadata = function (e) {
        video.current.play();
        console.log('loaded')
        setState(prev => ({ ...prev, netLoaded: true }))
      };
    } catch (error) {
      console.log(error)
    }
  }

  const getMedia = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log('enumerateDevices() not supported.');
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      net = await bodyPix.load()
      console.log(devices)
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setState(prev => ({ ...prev, devices: videoDevices }))
      playVideo(videoDevices[0].deviceId)
    } catch (err) {
      /* handle the error */
      console.log(err)
    }
  }, [])


  function onchange(e) {
    const { target: { name, value } } = e
    setState(prev => ({ ...prev, [name]: value }))
    clearInterval(timer)
  }

  function changeCamera(e) {
    clearInterval(timer)
    video.current.pause()
    playVideo(e.target.value)
  }

  useEffect(() => {
    getMedia()
  }, [getMedia])

  useEffect(() => {
    if (netLoaded) {
      load()
    }
  }, [onchange, netLoaded, playVideo])


  return (
    <div className="App">
      <video ref={video} width="320" height="240" style={{ display: 'none'}} />
      <canvas ref={canvas} width="320" height="240" />
      <select name="part" onChange={onchange}>
        {poses.map(pose => <option key={pose} >{pose}</option>)}
      </select>
      <select name="emo" onChange={onchange}>
        {emojs.map(emoj => <option key={emoj} >{emoj}</option>)}
      </select>
      <select name="device" onChange={changeCamera}>
        {devices.map(device => <option key={device.groupId || device.deviceId} value={device.deviceId}>{device.label || device.kind}</option>)}
      </select>
    </div>
  );
}

export default App;
