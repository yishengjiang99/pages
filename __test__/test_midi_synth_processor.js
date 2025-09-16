// Similar setup

class MidiSynthProcessor extends AudioWorkletProcessor{
  constructor(){
    super();
    this.voices=[];
    this.tableSize=4096;
    this.waveTable=new Float32Array(this.tableSize);
    for(let i=0;i<this.tableSize;i++) this.waveTable[i]=Math.sin((i/this.tableSize)*2*Math.PI);

    this.port = { postMessage: () => {} }; // Mock

    // Simulate onmessage
    this.onmessage = (e) => {
      const d = e.data;
      this.port.postMessage(d);

      if(d.type==='event'){
        const ev=d.event;
        if(ev.type==='noteOn'){
          const freq=440*Math.pow(2,(ev.note-69)/12);
          const inc=freq*this.tableSize/sampleRate;
          this.voices.push({note:ev.note,phase:0,inc,gain:(ev.velocity/127)*0.25,release:false});
        } else if(ev.type==='noteOff'){
          for(let v of this.voices) if(v.note===ev.note) v.release=true;
        }
      }
    };
  }

  process(_,outputs){
    const out=outputs[0];
    const frames=out[0].length;
    for(let i=0;i<frames;i++){
      let mix=0;
      for(let vi=this.voices.length-1;vi>=0;vi--){
        const v=this.voices[vi];
        const idx=Math.floor(v.phase)%this.tableSize;
        mix+=this.waveTable[idx]*v.gain;
        v.phase+=v.inc;
        if(v.release){ v.gain*=0.995; if(v.gain<0.001) this.voices.splice(vi,1); }
      }
      for(let ch=0;ch<out.length;ch++) out[ch][i]=mix;
    }
    return true;
  }
}

describe('MidiSynthProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new MidiSynthProcessor();
  });

  it('should add voice on noteOn', () => {
    processor.onmessage({ data: { type: 'event', event: { type: 'noteOn', note: 60, velocity: 127 } } });
    expect(processor.voices.length).to.equal(1);
    expect(processor.voices[0].gain).to.be.closeTo(0.25, 0.001);
  });

  it('should release voice on noteOff', () => {
    processor.onmessage({ data: { type: 'event', event: { type: 'noteOn', note: 60, velocity: 127 } } });
    processor.onmessage({ data: { type: 'event', event: { type: 'noteOff', note: 60 } } });
    expect(processor.voices[0].release).to.be.true;
  });

  it('should generate sine wave output', () => {
    processor.onmessage({ data: { type: 'event', event: { type: 'noteOn', note: 69, velocity: 127 } } }); // A4
    const outputs = [[new Float32Array(128), new Float32Array(128)]]; // Stereo

    processor.process(null, outputs);

    // Check if output is non-zero (sine wave)
    expect(outputs[0][0][0]).to.not.equal(0);
    expect(outputs[0][1][0]).to.equal(outputs[0][0][0]); // Same for both channels
  });
});