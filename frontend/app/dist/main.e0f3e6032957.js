(()=>{var $h=Object.create;var Va=Object.defineProperty;var Zh=Object.getOwnPropertyDescriptor;var Kh=Object.getOwnPropertyNames;var Jh=Object.getPrototypeOf,jh=Object.prototype.hasOwnProperty;var st=(i,e,t)=>()=>{if(t)throw t[0];try{return i&&(e=i(i=0)),e}catch(n){throw t=[n],n}};var Ga=(i,e)=>()=>{try{return e||i((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};var Qh=(i,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of Kh(e))!jh.call(i,s)&&s!==t&&Va(i,s,{get:()=>e[s],enumerable:!(n=Zh(e,s))||n.enumerable});return i};var to=(i,e,t)=>(t=i!=null?$h(Jh(i)):{},Qh(e||!i||!i.__esModule?Va(t,"default",{value:i,enumerable:!0}):t,i));function zi(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(yt[i&255]+yt[i>>8&255]+yt[i>>16&255]+yt[i>>24&255]+"-"+yt[e&255]+yt[e>>8&255]+"-"+yt[e>>16&15|64]+yt[e>>24&255]+"-"+yt[t&63|128]+yt[t>>8&255]+"-"+yt[t>>16&255]+yt[t>>24&255]+yt[n&255]+yt[n>>8&255]+yt[n>>16&255]+yt[n>>24&255]).toLowerCase()}function Mt(i,e,t){return Math.max(e,Math.min(t,i))}function pa(i,e){return(i%e+e)%e}function ed(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function td(i,e,t){return i!==e?(t-i)/(e-i):0}function es(i,e,t){return(1-t)*i+t*e}function nd(i,e,t,n){return es(i,e,1-Math.exp(-t*n))}function id(i,e=1){return e-Math.abs(pa(i,e*2)-e)}function sd(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function rd(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function od(i,e){return i+Math.floor(Math.random()*(e-i+1))}function ad(i,e){return i+Math.random()*(e-i)}function ld(i){return i*(.5-Math.random())}function cd(i){i!==void 0&&(El=i);let e=El+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function hd(i){return i*Qi}function ud(i){return i*ss}function Oo(i){return(i&i-1)===0&&i!==0}function dd(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function tr(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function fd(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),m=r((n-e)/2),g=a((n-e)/2);switch(s){case"XYX":i.set(o*h,l*u,l*d,o*c);break;case"YZY":i.set(l*d,o*h,l*u,o*c);break;case"ZXZ":i.set(l*u,l*d,o*h,o*c);break;case"XZX":i.set(o*h,l*g,l*m,o*c);break;case"YXY":i.set(l*m,o*h,l*g,o*c);break;case"ZYZ":i.set(l*g,l*m,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ei(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function wt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}function Sc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function nr(i){return document.createElementNS(("http:"+"//www.w3.org/1999/xhtml"),i)}function pd(){let i=nr("canvas");return i.style.display="block",i}function ts(i){i in wl||(wl[i]=!0,console.warn(i))}function Ci(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function lo(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}function co(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ir.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}function uo(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Xn.fromArray(i,r);let o=s.x*Math.abs(Xn.x)+s.y*Math.abs(Xn.y)+s.z*Math.abs(Xn.z),l=e.dot(Xn),c=t.dot(Xn),h=n.dot(Xn);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}function Mo(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}function Rd(i,e,t,n,s,r,a,o){let l;if(e.side===It?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Fn,o),l===null)return null;Os.copy(o),Os.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Os);return c<t.near||c>t.far?null:{distance:c,point:Os.clone(),object:i}}function Bs(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,xi),i.getVertexPosition(l,_i),i.getVertexPosition(c,yi);let h=Rd(i,e,t,n,xi,_i,yi,Fs);if(h){s&&(Ds.fromBufferAttribute(s,o),Ns.fromBufferAttribute(s,l),Us.fromBufferAttribute(s,c),h.uv=wi.getInterpolation(Fs,xi,_i,yi,Ds,Ns,Us,new Te)),r&&(Ds.fromBufferAttribute(r,o),Ns.fromBufferAttribute(r,l),Us.fromBufferAttribute(r,c),h.uv1=wi.getInterpolation(Fs,xi,_i,yi,Ds,Ns,Us,new Te),h.uv2=h.uv1),a&&(Bl.fromBufferAttribute(a,o),zl.fromBufferAttribute(a,l),Hl.fromBufferAttribute(a,c),h.normal=wi.getInterpolation(Fs,xi,_i,yi,Bl,zl,Hl,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new L,materialIndex:0};wi.getNormal(xi,_i,yi,u.normal),h.face=u}return h}function Fi(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Tt(i){let e={};for(let t=0;t<i.length;t++){let n=Fi(i[t]);for(let s in n)e[s]=n[s]}return e}function Cd(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function wc(i){return i.getRenderTarget()===null?i.outputColorSpace:$e.workingColorSpace}function Tc(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Ud(i,e){let t=e.isWebGL2,n=new WeakMap;function s(c,h){let u=c.array,d=c.usage,m=u.byteLength,g=i.createBuffer();i.bindBuffer(h,g),i.bufferData(h,u,d),c.onUploadCallback();let x;if(u instanceof Float32Array)x=i.FLOAT;else if(u instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)x=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else x=i.UNSIGNED_SHORT;else if(u instanceof Int16Array)x=i.SHORT;else if(u instanceof Uint32Array)x=i.UNSIGNED_INT;else if(u instanceof Int32Array)x=i.INT;else if(u instanceof Int8Array)x=i.BYTE;else if(u instanceof Uint8Array)x=i.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)x=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:x,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:m}}function r(c,h,u){let d=h.array,m=h._updateRange,g=h.updateRanges;if(i.bindBuffer(u,c),m.count===-1&&g.length===0&&i.bufferSubData(u,0,d),g.length!==0){for(let x=0,f=g.length;x<f;x++){let p=g[x];t?i.bufferSubData(u,p.start*d.BYTES_PER_ELEMENT,d,p.start,p.count):i.bufferSubData(u,p.start*d.BYTES_PER_ELEMENT,d.subarray(p.start,p.start+p.count))}h.clearUpdateRanges()}m.count!==-1&&(t?i.bufferSubData(u,m.offset*d.BYTES_PER_ELEMENT,d,m.offset,m.count):i.bufferSubData(u,m.offset*d.BYTES_PER_ELEMENT,d.subarray(m.offset,m.offset+m.count)),m.count=-1),h.onUploadCallback()}function a(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);let h=n.get(c);h&&(i.deleteBuffer(h.buffer),n.delete(c))}function l(c,h){if(c.isGLBufferAttribute){let d=n.get(c);(!d||d.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);let u=n.get(c);if(u===void 0)n.set(c,s(c,h));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(u.buffer,c,h),u.version=c.version}}return{get:a,remove:o,update:l}}function gm(i,e,t,n,s,r,a){let o=new Xe(0),l=r===!0?0:1,c,h,u=null,d=0,m=null;function g(f,p){let y=!1,_=p.isScene===!0?p.background:null;_&&_.isTexture&&(_=(p.backgroundBlurriness>0?t:e).get(_)),_===null?x(o,l):_&&_.isColor&&(x(_,1),y=!0);let b=i.xr.getEnvironmentBlendMode();b==="additive"?n.buffers.color.setClear(0,0,0,1,a):b==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||y)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),_&&(_.isCubeTexture||_.mapping===yr)?(h===void 0&&(h=new Wt(new os(1,1,1),new bn({name:"BackgroundCubeMaterial",uniforms:Fi(on.backgroundCube.uniforms),vertexShader:on.backgroundCube.vertexShader,fragmentShader:on.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(S,R,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),h.material.uniforms.envMap.value=_,h.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=p.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=p.backgroundIntensity,h.material.toneMapped=$e.getTransfer(_.colorSpace)!==Je,(u!==_||d!==_.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,u=_,d=_.version,m=i.toneMapping),h.layers.enableAll(),f.unshift(h,h.geometry,h.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new Wt(new Vo(2,2),new bn({name:"BackgroundMaterial",uniforms:Fi(on.background.uniforms),vertexShader:on.background.vertexShader,fragmentShader:on.background.fragmentShader,side:Fn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=p.backgroundIntensity,c.material.toneMapped=$e.getTransfer(_.colorSpace)!==Je,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||d!==_.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,u=_,d=_.version,m=i.toneMapping),c.layers.enableAll(),f.unshift(c,c.geometry,c.material,0,0,null))}function x(f,p){f.getRGB(Hs,wc(i)),n.buffers.color.setClear(Hs.r,Hs.g,Hs.b,p,a)}return{getClearColor:function(){return o},setClearColor:function(f,p=1){o.set(f),l=p,x(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(f){l=f,x(o,l)},render:g}}function xm(i,e,t,n){let s=i.getParameter(i.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||r!==null,o={},l=f(null),c=l,h=!1;function u(I,U,G,Y,q){let W=!1;if(a){let Q=x(Y,G,U);c!==Q&&(c=Q,m(c.object)),W=p(I,Y,G,q),W&&y(I,Y,G,q)}else{let Q=U.wireframe===!0;(c.geometry!==Y.id||c.program!==G.id||c.wireframe!==Q)&&(c.geometry=Y.id,c.program=G.id,c.wireframe=Q,W=!0)}q!==null&&t.update(q,i.ELEMENT_ARRAY_BUFFER),(W||h)&&(h=!1,N(I,U,G,Y),q!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function d(){return n.isWebGL2?i.createVertexArray():r.createVertexArrayOES()}function m(I){return n.isWebGL2?i.bindVertexArray(I):r.bindVertexArrayOES(I)}function g(I){return n.isWebGL2?i.deleteVertexArray(I):r.deleteVertexArrayOES(I)}function x(I,U,G){let Y=G.wireframe===!0,q=o[I.id];q===void 0&&(q={},o[I.id]=q);let W=q[U.id];W===void 0&&(W={},q[U.id]=W);let Q=W[Y];return Q===void 0&&(Q=f(d()),W[Y]=Q),Q}function f(I){let U=[],G=[],Y=[];for(let q=0;q<s;q++)U[q]=0,G[q]=0,Y[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:G,attributeDivisors:Y,object:I,attributes:{},index:null}}function p(I,U,G,Y){let q=c.attributes,W=U.attributes,Q=0,ne=G.getAttributes();for(let ue in ne)if(ne[ue].location>=0){let Z=q[ue],he=W[ue];if(he===void 0&&(ue==="instanceMatrix"&&I.instanceMatrix&&(he=I.instanceMatrix),ue==="instanceColor"&&I.instanceColor&&(he=I.instanceColor)),Z===void 0||Z.attribute!==he||he&&Z.data!==he.data)return!0;Q++}return c.attributesNum!==Q||c.index!==Y}function y(I,U,G,Y){let q={},W=U.attributes,Q=0,ne=G.getAttributes();for(let ue in ne)if(ne[ue].location>=0){let Z=W[ue];Z===void 0&&(ue==="instanceMatrix"&&I.instanceMatrix&&(Z=I.instanceMatrix),ue==="instanceColor"&&I.instanceColor&&(Z=I.instanceColor));let he={};he.attribute=Z,Z&&Z.data&&(he.data=Z.data),q[ue]=he,Q++}c.attributes=q,c.attributesNum=Q,c.index=Y}function _(){let I=c.newAttributes;for(let U=0,G=I.length;U<G;U++)I[U]=0}function b(I){S(I,0)}function S(I,U){let G=c.newAttributes,Y=c.enabledAttributes,q=c.attributeDivisors;G[I]=1,Y[I]===0&&(i.enableVertexAttribArray(I),Y[I]=1),q[I]!==U&&((n.isWebGL2?i:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](I,U),q[I]=U)}function R(){let I=c.newAttributes,U=c.enabledAttributes;for(let G=0,Y=U.length;G<Y;G++)U[G]!==I[G]&&(i.disableVertexAttribArray(G),U[G]=0)}function w(I,U,G,Y,q,W,Q){Q===!0?i.vertexAttribIPointer(I,U,G,q,W):i.vertexAttribPointer(I,U,G,Y,q,W)}function N(I,U,G,Y){if(n.isWebGL2===!1&&(I.isInstancedMesh||Y.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;_();let q=Y.attributes,W=G.getAttributes(),Q=U.defaultAttributeValues;for(let ne in W){let ue=W[ne];if(ue.location>=0){let V=q[ne];if(V===void 0&&(ne==="instanceMatrix"&&I.instanceMatrix&&(V=I.instanceMatrix),ne==="instanceColor"&&I.instanceColor&&(V=I.instanceColor)),V!==void 0){let Z=V.normalized,he=V.itemSize,_e=t.get(V);if(_e===void 0)continue;let ge=_e.buffer,Ce=_e.type,Pe=_e.bytesPerElement,Se=n.isWebGL2===!0&&(Ce===i.INT||Ce===i.UNSIGNED_INT||V.gpuType===pc);if(V.isInterleavedBufferAttribute){let Ve=V.data,O=Ve.stride,ut=V.offset;if(Ve.isInstancedInterleavedBuffer){for(let Me=0;Me<ue.locationSize;Me++)S(ue.location+Me,Ve.meshPerAttribute);I.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=Ve.meshPerAttribute*Ve.count)}else for(let Me=0;Me<ue.locationSize;Me++)b(ue.location+Me);i.bindBuffer(i.ARRAY_BUFFER,ge);for(let Me=0;Me<ue.locationSize;Me++)w(ue.location+Me,he/ue.locationSize,Ce,Z,O*Pe,(ut+he/ue.locationSize*Me)*Pe,Se)}else{if(V.isInstancedBufferAttribute){for(let Ve=0;Ve<ue.locationSize;Ve++)S(ue.location+Ve,V.meshPerAttribute);I.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=V.meshPerAttribute*V.count)}else for(let Ve=0;Ve<ue.locationSize;Ve++)b(ue.location+Ve);i.bindBuffer(i.ARRAY_BUFFER,ge);for(let Ve=0;Ve<ue.locationSize;Ve++)w(ue.location+Ve,he/ue.locationSize,Ce,Z,he*Pe,he/ue.locationSize*Ve*Pe,Se)}}else if(Q!==void 0){let Z=Q[ne];if(Z!==void 0)switch(Z.length){case 2:i.vertexAttrib2fv(ue.location,Z);break;case 3:i.vertexAttrib3fv(ue.location,Z);break;case 4:i.vertexAttrib4fv(ue.location,Z);break;default:i.vertexAttrib1fv(ue.location,Z)}}}}R()}function M(){X();for(let I in o){let U=o[I];for(let G in U){let Y=U[G];for(let q in Y)g(Y[q].object),delete Y[q];delete U[G]}delete o[I]}}function T(I){if(o[I.id]===void 0)return;let U=o[I.id];for(let G in U){let Y=U[G];for(let q in Y)g(Y[q].object),delete Y[q];delete U[G]}delete o[I.id]}function F(I){for(let U in o){let G=o[U];if(G[I.id]===void 0)continue;let Y=G[I.id];for(let q in Y)g(Y[q].object),delete Y[q];delete G[I.id]}}function X(){j(),h=!0,c!==l&&(c=l,m(c.object))}function j(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:u,reset:X,resetDefaultState:j,dispose:M,releaseStatesOfGeometry:T,releaseStatesOfProgram:F,initAttributes:_,enableAttribute:b,disableUnusedAttributes:R}}function _m(i,e,t,n){let s=n.isWebGL2,r;function a(h){r=h}function o(h,u){i.drawArrays(r,h,u),t.update(u,r,1)}function l(h,u,d){if(d===0)return;let m,g;if(s)m=i,g="drawArraysInstanced";else if(m=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",m===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[g](r,h,u,d),t.update(u,r,d)}function c(h,u,d){if(d===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<d;g++)this.render(h[g],u[g]);else{m.multiDrawArraysWEBGL(r,h,0,u,0,d);let g=0;for(let x=0;x<d;x++)g+=u[x];t.update(g,r,1)}}this.setMode=a,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function ym(i,e,t){let n;function s(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){let w=e.get("EXT_texture_filter_anisotropic");n=i.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(w){if(w==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let a=typeof WebGL2RenderingContext<"u"&&i.constructor.name==="WebGL2RenderingContext",o=t.precision!==void 0?t.precision:"highp",l=r(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);let c=a||e.has("WEBGL_draw_buffers"),h=t.logarithmicDepthBuffer===!0,u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),x=i.getParameter(i.MAX_VERTEX_ATTRIBS),f=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),p=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),_=d>0,b=a||e.has("OES_texture_float"),S=_&&b,R=a?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:c,getMaxAnisotropy:s,getMaxPrecision:r,precision:o,logarithmicDepthBuffer:h,maxTextures:u,maxVertexTextures:d,maxTextureSize:m,maxCubemapSize:g,maxAttributes:x,maxVertexUniforms:f,maxVaryings:p,maxFragmentUniforms:y,vertexTextures:_,floatFragmentTextures:b,floatVertexTextures:S,maxSamples:R}}function vm(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Ft,o=new ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let m=u.length!==0||d||n!==0||s;return s=d,n=u.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,m){let g=u.clippingPlanes,x=u.clipIntersection,f=u.clipShadows,p=i.get(u);if(!s||g===null||g.length===0||r&&!f)r?h(null):c();else{let y=r?0:n,_=y*4,b=p.clippingState||null;l.value=b,b=h(g,d,_,m);for(let S=0;S!==_;++S)b[S]=t[S];p.clippingState=b,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,m,g){let x=u!==null?u.length:0,f=null;if(x!==0){if(f=l.value,g!==!0||f===null){let p=m+x*4,y=d.matrixWorldInverse;o.getNormalMatrix(y),(f===null||f.length<p)&&(f=new Float32Array(p));for(let _=0,b=m;_!==x;++_,b+=4)a.copy(u[_]).applyMatrix4(y,o),a.normal.toArray(f,b),f[b+3]=a.constant}l.value=f,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,f}}function Mm(i){let e=new WeakMap;function t(a,o){return o===Lo?a.mapping=Ii:o===Do&&(a.mapping=Li),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Lo||o===Do)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new ko(l.height/2);return c.fromEquirectangularTexture(i,a),e.set(a,c),a.addEventListener("dispose",s),t(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}function bm(i){let e=[],t=[],n=[],s=i,r=i-Ti+1+kl.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-Ti?l=kl[a-i+Ti-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],m=6,g=6,x=3,f=2,p=1,y=new Float32Array(x*g*m),_=new Float32Array(f*g*m),b=new Float32Array(p*g*m);for(let R=0;R<m;R++){let w=R%3*2/3-1,N=R>2?0:-1,M=[w,N,0,w+2/3,N,0,w+2/3,N+1,0,w,N,0,w+2/3,N+1,0,w,N+1,0];y.set(M,x*g*R),_.set(d,f*g*R);let T=[R,R,R,R,R,R];b.set(T,p*g*R)}let S=new ln;S.setAttribute("position",new Bt(y,x)),S.setAttribute("uv",new Bt(_,f)),S.setAttribute("faceIndex",new Bt(b,p)),e.push(S),s>Ti&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Wl(i,e,t){let n=new Mn(i,e,t);return n.texture.mapping=yr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ks(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function Sm(i,e,t){let n=new Float32Array(Kn),s=new L(0,1,0);return new bn({name:"SphericalGaussianBlur",defines:{n:Kn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ma(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Dn,depthTest:!1,depthWrite:!1})}function Xl(){return new bn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ma(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Dn,depthTest:!1,depthWrite:!1})}function Yl(){return new bn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ma(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Dn,depthTest:!1,depthWrite:!1})}function ma(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Em(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===Lo||l===Do,h=l===Ii||l===Li;if(c||h)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let u=e.get(o);return t===null&&(t=new ur(i)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),e.set(o,u),u.texture}else{if(e.has(o))return e.get(o).texture;{let u=o.image;if(c&&u&&u.height>0||h&&u&&s(u)){t===null&&(t=new ur(i));let d=c?t.fromEquirectangular(o):t.fromCubemap(o);return e.set(o,d),o.addEventListener("dispose",r),d.texture}else return null}}}return o}function s(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function wm(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){let s=t(n);return s===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Tm(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let x=d.morphAttributes[g];for(let f=0,p=x.length;f<p;f++)e.remove(x[f])}d.removeEventListener("dispose",a),delete s[d.id];let m=r.get(d);m&&(e.remove(m),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let m=u.morphAttributes;for(let g in m){let x=m[g];for(let f=0,p=x.length;f<p;f++)e.update(x[f],i.ARRAY_BUFFER)}}function c(u){let d=[],m=u.index,g=u.attributes.position,x=0;if(m!==null){let y=m.array;x=m.version;for(let _=0,b=y.length;_<b;_+=3){let S=y[_+0],R=y[_+1],w=y[_+2];d.push(S,R,R,w,w,S)}}else if(g!==void 0){let y=g.array;x=g.version;for(let _=0,b=y.length/3-1;_<b;_+=3){let S=_+0,R=_+1,w=_+2;d.push(S,R,R,w,w,S)}}else return;let f=new(Sc(d)?lr:ar)(d,1);f.version=x;let p=r.get(u);p&&e.remove(p),r.set(u,f)}function h(u){let d=r.get(u);if(d){let m=u.index;m!==null&&d.version<m.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Am(i,e,t,n){let s=n.isWebGL2,r;function a(m){r=m}let o,l;function c(m){o=m.type,l=m.bytesPerElement}function h(m,g){i.drawElements(r,g,o,m*l),t.update(g,r,1)}function u(m,g,x){if(x===0)return;let f,p;if(s)f=i,p="drawElementsInstanced";else if(f=e.get("ANGLE_instanced_arrays"),p="drawElementsInstancedANGLE",f===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[p](r,g,o,m*l,x),t.update(g,r,x)}function d(m,g,x){if(x===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let p=0;p<x;p++)this.render(m[p]/l,g[p]);else{f.multiDrawElementsWEBGL(r,g,0,o,m,0,x);let p=0;for(let y=0;y<x;y++)p+=g[y];t.update(p,r,1)}}this.setMode=a,this.setIndex=c,this.render=h,this.renderInstances=u,this.renderMultiDraw=d}function Rm(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Cm(i,e){return i[0]-e[0]}function Pm(i,e){return Math.abs(e[1])-Math.abs(i[1])}function Im(i,e,t){let n={},s=new Float32Array(8),r=new WeakMap,a=new gt,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,h,u){let d=c.morphTargetInfluences;if(e.isWebGL2===!0){let m=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,g=m!==void 0?m.length:0,x=r.get(h);if(x===void 0||x.count!==g){let I=function(){X.dispose(),r.delete(h),h.removeEventListener("dispose",I)};x!==void 0&&x.texture.dispose();let y=h.morphAttributes.position!==void 0,_=h.morphAttributes.normal!==void 0,b=h.morphAttributes.color!==void 0,S=h.morphAttributes.position||[],R=h.morphAttributes.normal||[],w=h.morphAttributes.color||[],N=0;y===!0&&(N=1),_===!0&&(N=2),b===!0&&(N=3);let M=h.attributes.position.count*N,T=1;M>e.maxTextureSize&&(T=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let F=new Float32Array(M*T*4*g),X=new rr(F,M,T,g);X.type=Ln,X.needsUpdate=!0;let j=N*4;for(let U=0;U<g;U++){let G=S[U],Y=R[U],q=w[U],W=M*T*4*U;for(let Q=0;Q<G.count;Q++){let ne=Q*j;y===!0&&(a.fromBufferAttribute(G,Q),F[W+ne+0]=a.x,F[W+ne+1]=a.y,F[W+ne+2]=a.z,F[W+ne+3]=0),_===!0&&(a.fromBufferAttribute(Y,Q),F[W+ne+4]=a.x,F[W+ne+5]=a.y,F[W+ne+6]=a.z,F[W+ne+7]=0),b===!0&&(a.fromBufferAttribute(q,Q),F[W+ne+8]=a.x,F[W+ne+9]=a.y,F[W+ne+10]=a.z,F[W+ne+11]=q.itemSize===4?a.w:1)}}x={count:g,texture:X,size:new Te(M,T)},r.set(h,x),h.addEventListener("dispose",I)}let f=0;for(let y=0;y<d.length;y++)f+=d[y];let p=h.morphTargetsRelative?1:1-f;u.getUniforms().setValue(i,"morphTargetBaseInfluence",p),u.getUniforms().setValue(i,"morphTargetInfluences",d),u.getUniforms().setValue(i,"morphTargetsTexture",x.texture,t),u.getUniforms().setValue(i,"morphTargetsTextureSize",x.size)}else{let m=d===void 0?0:d.length,g=n[h.id];if(g===void 0||g.length!==m){g=[];for(let _=0;_<m;_++)g[_]=[_,0];n[h.id]=g}for(let _=0;_<m;_++){let b=g[_];b[0]=_,b[1]=d[_]}g.sort(Pm);for(let _=0;_<8;_++)_<m&&g[_][1]?(o[_][0]=g[_][0],o[_][1]=g[_][1]):(o[_][0]=Number.MAX_SAFE_INTEGER,o[_][1]=0);o.sort(Cm);let x=h.morphAttributes.position,f=h.morphAttributes.normal,p=0;for(let _=0;_<8;_++){let b=o[_],S=b[0],R=b[1];S!==Number.MAX_SAFE_INTEGER&&R?(x&&h.getAttribute("morphTarget"+_)!==x[S]&&h.setAttribute("morphTarget"+_,x[S]),f&&h.getAttribute("morphNormal"+_)!==f[S]&&h.setAttribute("morphNormal"+_,f[S]),s[_]=R,p+=R):(x&&h.hasAttribute("morphTarget"+_)===!0&&h.deleteAttribute("morphTarget"+_),f&&h.hasAttribute("morphNormal"+_)===!0&&h.deleteAttribute("morphNormal"+_),s[_]=0)}let y=h.morphTargetsRelative?1:1-p;u.getUniforms().setValue(i,"morphTargetBaseInfluence",y),u.getUniforms().setValue(i,"morphTargetInfluences",s)}}return{update:l}}function Lm(i,e,t,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:a}}function Hi(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=ql[s];if(r===void 0&&(r=new Float32Array(s),ql[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function lt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function ct(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Sr(i,e){let t=$l[e];t===void 0&&(t=new Int32Array(e),$l[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Dm(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Nm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(lt(t,e))return;i.uniform2fv(this.addr,e),ct(t,e)}}function Um(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(lt(t,e))return;i.uniform3fv(this.addr,e),ct(t,e)}}function Fm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(lt(t,e))return;i.uniform4fv(this.addr,e),ct(t,e)}}function Om(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(lt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),ct(t,e)}else{if(lt(t,n))return;Jl.set(n),i.uniformMatrix2fv(this.addr,!1,Jl),ct(t,n)}}function Bm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(lt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),ct(t,e)}else{if(lt(t,n))return;Kl.set(n),i.uniformMatrix3fv(this.addr,!1,Kl),ct(t,n)}}function zm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(lt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),ct(t,e)}else{if(lt(t,n))return;Zl.set(n),i.uniformMatrix4fv(this.addr,!1,Zl),ct(t,n)}}function Hm(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function km(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(lt(t,e))return;i.uniform2iv(this.addr,e),ct(t,e)}}function Vm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(lt(t,e))return;i.uniform3iv(this.addr,e),ct(t,e)}}function Gm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(lt(t,e))return;i.uniform4iv(this.addr,e),ct(t,e)}}function Wm(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Xm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(lt(t,e))return;i.uniform2uiv(this.addr,e),ct(t,e)}}function Ym(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(lt(t,e))return;i.uniform3uiv(this.addr,e),ct(t,e)}}function qm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(lt(t,e))return;i.uniform4uiv(this.addr,e),ct(t,e)}}function $m(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r=this.type===i.SAMPLER_2D_SHADOW?Rc:Ac;t.setTexture2D(e||r,s)}function Zm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Pc,s)}function Km(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Ic,s)}function Jm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Cc,s)}function jm(i){switch(i){case 5126:return Dm;case 35664:return Nm;case 35665:return Um;case 35666:return Fm;case 35674:return Om;case 35675:return Bm;case 35676:return zm;case 5124:case 35670:return Hm;case 35667:case 35671:return km;case 35668:case 35672:return Vm;case 35669:case 35673:return Gm;case 5125:return Wm;case 36294:return Xm;case 36295:return Ym;case 36296:return qm;case 35678:case 36198:case 36298:case 36306:case 35682:return $m;case 35679:case 36299:case 36307:return Zm;case 35680:case 36300:case 36308:case 36293:return Km;case 36289:case 36303:case 36311:case 36292:return Jm}}function Qm(i,e){i.uniform1fv(this.addr,e)}function eg(i,e){let t=Hi(e,this.size,2);i.uniform2fv(this.addr,t)}function tg(i,e){let t=Hi(e,this.size,3);i.uniform3fv(this.addr,t)}function ng(i,e){let t=Hi(e,this.size,4);i.uniform4fv(this.addr,t)}function ig(i,e){let t=Hi(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function sg(i,e){let t=Hi(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function rg(i,e){let t=Hi(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function og(i,e){i.uniform1iv(this.addr,e)}function ag(i,e){i.uniform2iv(this.addr,e)}function lg(i,e){i.uniform3iv(this.addr,e)}function cg(i,e){i.uniform4iv(this.addr,e)}function hg(i,e){i.uniform1uiv(this.addr,e)}function ug(i,e){i.uniform2uiv(this.addr,e)}function dg(i,e){i.uniform3uiv(this.addr,e)}function fg(i,e){i.uniform4uiv(this.addr,e)}function pg(i,e,t){let n=this.cache,s=e.length,r=Sr(t,s);lt(n,r)||(i.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||Ac,r[a])}function mg(i,e,t){let n=this.cache,s=e.length,r=Sr(t,s);lt(n,r)||(i.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Pc,r[a])}function gg(i,e,t){let n=this.cache,s=e.length,r=Sr(t,s);lt(n,r)||(i.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Ic,r[a])}function xg(i,e,t){let n=this.cache,s=e.length,r=Sr(t,s);lt(n,r)||(i.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Cc,r[a])}function _g(i){switch(i){case 5126:return Qm;case 35664:return eg;case 35665:return tg;case 35666:return ng;case 35674:return ig;case 35675:return sg;case 35676:return rg;case 5124:case 35670:return og;case 35667:case 35671:return ag;case 35668:case 35672:return lg;case 35669:case 35673:return cg;case 5125:return hg;case 36294:return ug;case 36295:return dg;case 36296:return fg;case 35678:case 36198:case 36298:case 36306:case 35682:return pg;case 35679:case 36299:case 36307:return mg;case 35680:case 36300:case 36308:case 36293:return gg;case 36289:case 36303:case 36311:case 36292:return xg}}function jl(i,e){i.seq.push(e),i.map[e.id]=e}function yg(i,e,t){let n=i.name,s=n.length;for(Co.lastIndex=0;;){let r=Co.exec(n),a=Co.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){jl(t,c===void 0?new Wo(o,i,e):new Xo(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new Yo(o),jl(t,u)),t=u}}}function Ql(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}function bg(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}function Sg(i){let e=$e.getPrimaries($e.workingColorSpace),t=$e.getPrimaries(i),n;switch(e===t?n="":e===Qs&&t===js?n="LinearDisplayP3ToLinearSRGB":e===js&&t===Qs&&(n="LinearSRGBToLinearDisplayP3"),i){case en:case Mr:return[n,"LinearTransferOETF"];case at:case fa:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function ec(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+bg(i.getShaderSource(e),a)}else return s}function Eg(i,e){let t=Sg(e);return`vec4 ${i}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function wg(i,e){let t;switch(e){case Ru:t="Linear";break;case Cu:t="Reinhard";break;case Pu:t="OptimizedCineon";break;case Iu:t="ACESFilmic";break;case Du:t="AgX";break;case Lu:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Tg(i){return[i.extensionDerivatives||i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Ai).join(`
`)}function Ag(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Ai).join(`
`)}function Rg(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Cg(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Ai(i){return i!==""}function tc(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function nc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}function qo(i){return i.replace(Pg,Lg)}function Lg(i,e){let t=Fe[e];if(t===void 0){let n=Ig.get(e);if(n!==void 0)t=Fe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return qo(t)}function ic(i){return i.replace(Dg,Ng)}function Ng(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function sc(i){let e="precision "+i.precision+` float;
precision `+i.precision+" int;";return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Ug(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===uc?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===nu?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===yn&&(e="SHADOWMAP_TYPE_VSM"),e}function Fg(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ii:case Li:e="ENVMAP_TYPE_CUBE";break;case yr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Og(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Li&&(e="ENVMAP_MODE_REFRACTION"),e}function Bg(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case dc:e="ENVMAP_BLENDING_MULTIPLY";break;case Tu:e="ENVMAP_BLENDING_MIX";break;case Au:e="ENVMAP_BLENDING_ADD";break}return e}function zg(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Hg(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Ug(t),c=Fg(t),h=Og(t),u=Bg(t),d=zg(t),m=t.isWebGL2?"":Tg(t),g=Ag(t),x=Rg(r),f=s.createProgram(),p,y,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Ai).join(`
`),p.length>0&&(p+=`
`),y=[m,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Ai).join(`
`),y.length>0&&(y+=`
`)):(p=[sc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ai).join(`
`),y=[m,sc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Nn?"#define TONE_MAPPING":"",t.toneMapping!==Nn?Fe.tonemapping_pars_fragment:"",t.toneMapping!==Nn?wg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Fe.colorspace_pars_fragment,Eg("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ai).join(`
`)),a=qo(a),a=tc(a,t),a=nc(a,t),o=qo(o),o=tc(o,t),o=nc(o,t),a=ic(a),o=ic(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,p=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,y=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Sl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Sl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+y);let b=_+p+a,S=_+y+o,R=Ql(s,s.VERTEX_SHADER,b),w=Ql(s,s.FRAGMENT_SHADER,S);s.attachShader(f,R),s.attachShader(f,w),t.index0AttributeName!==void 0?s.bindAttribLocation(f,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(f,0,"position"),s.linkProgram(f);function N(X){if(i.debug.checkShaderErrors){let j=s.getProgramInfoLog(f).trim(),I=s.getShaderInfoLog(R).trim(),U=s.getShaderInfoLog(w).trim(),G=!0,Y=!0;if(s.getProgramParameter(f,s.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,f,R,w);else{let q=ec(s,R,"vertex"),W=ec(s,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(f,s.VALIDATE_STATUS)+`

Program Info Log: `+j+`
`+q+`
`+W)}else j!==""?console.warn("THREE.WebGLProgram: Program Info Log:",j):(I===""||U==="")&&(Y=!1);Y&&(X.diagnostics={runnable:G,programLog:j,vertexShader:{log:I,prefix:p},fragmentShader:{log:U,prefix:y}})}s.deleteShader(R),s.deleteShader(w),M=new Pi(s,f),T=Cg(s,f)}let M;this.getUniforms=function(){return M===void 0&&N(this),M};let T;this.getAttributes=function(){return T===void 0&&N(this),T};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=s.getProgramParameter(f,vg)),F},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(f),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Mg++,this.cacheKey=e,this.usedTimes=1,this.program=f,this.vertexShader=R,this.fragmentShader=w,this}function Vg(i,e,t,n,s,r,a){let o=new rs,l=new $o,c=[],h=s.isWebGL2,u=s.logarithmicDepthBuffer,d=s.vertexTextures,m=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(M){return M===0?"uv":`uv${M}`}function f(M,T,F,X,j){let I=X.fog,U=j.geometry,G=M.isMeshStandardMaterial?X.environment:null,Y=(M.isMeshStandardMaterial?t:e).get(M.envMap||G),q=Y&&Y.mapping===yr?Y.image.height:null,W=g[M.type];M.precision!==null&&(m=s.getMaxPrecision(M.precision),m!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",m,"instead."));let Q=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,ne=Q!==void 0?Q.length:0,ue=0;U.morphAttributes.position!==void 0&&(ue=1),U.morphAttributes.normal!==void 0&&(ue=2),U.morphAttributes.color!==void 0&&(ue=3);let V,Z,he,_e;if(W){let St=on[W];V=St.vertexShader,Z=St.fragmentShader}else V=M.vertexShader,Z=M.fragmentShader,l.update(M),he=l.getVertexShaderID(M),_e=l.getFragmentShaderID(M);let ge=i.getRenderTarget(),Ce=j.isInstancedMesh===!0,Pe=j.isBatchedMesh===!0,Se=!!M.map,Ve=!!M.matcap,O=!!Y,ut=!!M.aoMap,Me=!!M.lightMap,Ae=!!M.bumpMap,pe=!!M.normalMap,Ke=!!M.displacementMap,Ie=!!M.emissiveMap,A=!!M.metalnessMap,v=!!M.roughnessMap,B=M.anisotropy>0,te=M.clearcoat>0,J=M.iridescence>0,ee=M.sheen>0,me=M.transmission>0,ce=B&&!!M.anisotropyMap,fe=te&&!!M.clearcoatMap,Ee=te&&!!M.clearcoatNormalMap,De=te&&!!M.clearcoatRoughnessMap,K=J&&!!M.iridescenceMap,Ge=J&&!!M.iridescenceThicknessMap,C=ee&&!!M.sheenColorMap,$=ee&&!!M.sheenRoughnessMap,ae=!!M.specularMap,ie=!!M.specularColorMap,xe=!!M.specularIntensityMap,ze=me&&!!M.transmissionMap,We=me&&!!M.thicknessMap,Oe=!!M.gradientMap,oe=!!M.alphaMap,P=M.alphaTest>0,se=!!M.alphaHash,re=!!M.extensions,be=!!U.attributes.uv1,ye=!!U.attributes.uv2,Ye=!!U.attributes.uv3,qe=Nn;return M.toneMapped&&(ge===null||ge.isXRRenderTarget===!0)&&(qe=i.toneMapping),{isWebGL2:h,shaderID:W,shaderType:M.type,shaderName:M.name,vertexShader:V,fragmentShader:Z,defines:M.defines,customVertexShaderID:he,customFragmentShaderID:_e,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:m,batching:Pe,instancing:Ce,instancingColor:Ce&&j.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:ge===null?i.outputColorSpace:ge.isXRRenderTarget===!0?ge.texture.colorSpace:en,map:Se,matcap:Ve,envMap:O,envMapMode:O&&Y.mapping,envMapCubeUVHeight:q,aoMap:ut,lightMap:Me,bumpMap:Ae,normalMap:pe,displacementMap:d&&Ke,emissiveMap:Ie,normalMapObjectSpace:pe&&M.normalMapType===Yu,normalMapTangentSpace:pe&&M.normalMapType===Xu,metalnessMap:A,roughnessMap:v,anisotropy:B,anisotropyMap:ce,clearcoat:te,clearcoatMap:fe,clearcoatNormalMap:Ee,clearcoatRoughnessMap:De,iridescence:J,iridescenceMap:K,iridescenceThicknessMap:Ge,sheen:ee,sheenColorMap:C,sheenRoughnessMap:$,specularMap:ae,specularColorMap:ie,specularIntensityMap:xe,transmission:me,transmissionMap:ze,thicknessMap:We,gradientMap:Oe,opaque:M.transparent===!1&&M.blending===Ri,alphaMap:oe,alphaTest:P,alphaHash:se,combine:M.combine,mapUv:Se&&x(M.map.channel),aoMapUv:ut&&x(M.aoMap.channel),lightMapUv:Me&&x(M.lightMap.channel),bumpMapUv:Ae&&x(M.bumpMap.channel),normalMapUv:pe&&x(M.normalMap.channel),displacementMapUv:Ke&&x(M.displacementMap.channel),emissiveMapUv:Ie&&x(M.emissiveMap.channel),metalnessMapUv:A&&x(M.metalnessMap.channel),roughnessMapUv:v&&x(M.roughnessMap.channel),anisotropyMapUv:ce&&x(M.anisotropyMap.channel),clearcoatMapUv:fe&&x(M.clearcoatMap.channel),clearcoatNormalMapUv:Ee&&x(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:De&&x(M.clearcoatRoughnessMap.channel),iridescenceMapUv:K&&x(M.iridescenceMap.channel),iridescenceThicknessMapUv:Ge&&x(M.iridescenceThicknessMap.channel),sheenColorMapUv:C&&x(M.sheenColorMap.channel),sheenRoughnessMapUv:$&&x(M.sheenRoughnessMap.channel),specularMapUv:ae&&x(M.specularMap.channel),specularColorMapUv:ie&&x(M.specularColorMap.channel),specularIntensityMapUv:xe&&x(M.specularIntensityMap.channel),transmissionMapUv:ze&&x(M.transmissionMap.channel),thicknessMapUv:We&&x(M.thicknessMap.channel),alphaMapUv:oe&&x(M.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(pe||B),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,vertexUv1s:be,vertexUv2s:ye,vertexUv3s:Ye,pointsUvs:j.isPoints===!0&&!!U.attributes.uv&&(Se||oe),fog:!!I,useFog:M.fog===!0,fogExp2:I&&I.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:j.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:ne,morphTextureStride:ue,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&F.length>0,shadowMapType:i.shadowMap.type,toneMapping:qe,useLegacyLights:i._useLegacyLights,decodeVideoTexture:Se&&M.map.isVideoTexture===!0&&$e.getTransfer(M.map.colorSpace)===Je,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Jt,flipSided:M.side===It,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionDerivatives:re&&M.extensions.derivatives===!0,extensionFragDepth:re&&M.extensions.fragDepth===!0,extensionDrawBuffers:re&&M.extensions.drawBuffers===!0,extensionShaderTextureLOD:re&&M.extensions.shaderTextureLOD===!0,extensionClipCullDistance:re&&M.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()}}function p(M){let T=[];if(M.shaderID?T.push(M.shaderID):(T.push(M.customVertexShaderID),T.push(M.customFragmentShaderID)),M.defines!==void 0)for(let F in M.defines)T.push(F),T.push(M.defines[F]);return M.isRawShaderMaterial===!1&&(y(T,M),_(T,M),T.push(i.outputColorSpace)),T.push(M.customProgramCacheKey),T.join()}function y(M,T){M.push(T.precision),M.push(T.outputColorSpace),M.push(T.envMapMode),M.push(T.envMapCubeUVHeight),M.push(T.mapUv),M.push(T.alphaMapUv),M.push(T.lightMapUv),M.push(T.aoMapUv),M.push(T.bumpMapUv),M.push(T.normalMapUv),M.push(T.displacementMapUv),M.push(T.emissiveMapUv),M.push(T.metalnessMapUv),M.push(T.roughnessMapUv),M.push(T.anisotropyMapUv),M.push(T.clearcoatMapUv),M.push(T.clearcoatNormalMapUv),M.push(T.clearcoatRoughnessMapUv),M.push(T.iridescenceMapUv),M.push(T.iridescenceThicknessMapUv),M.push(T.sheenColorMapUv),M.push(T.sheenRoughnessMapUv),M.push(T.specularMapUv),M.push(T.specularColorMapUv),M.push(T.specularIntensityMapUv),M.push(T.transmissionMapUv),M.push(T.thicknessMapUv),M.push(T.combine),M.push(T.fogExp2),M.push(T.sizeAttenuation),M.push(T.morphTargetsCount),M.push(T.morphAttributeCount),M.push(T.numDirLights),M.push(T.numPointLights),M.push(T.numSpotLights),M.push(T.numSpotLightMaps),M.push(T.numHemiLights),M.push(T.numRectAreaLights),M.push(T.numDirLightShadows),M.push(T.numPointLightShadows),M.push(T.numSpotLightShadows),M.push(T.numSpotLightShadowsWithMaps),M.push(T.numLightProbes),M.push(T.shadowMapType),M.push(T.toneMapping),M.push(T.numClippingPlanes),M.push(T.numClipIntersection),M.push(T.depthPacking)}function _(M,T){o.disableAll(),T.isWebGL2&&o.enable(0),T.supportsVertexTextures&&o.enable(1),T.instancing&&o.enable(2),T.instancingColor&&o.enable(3),T.matcap&&o.enable(4),T.envMap&&o.enable(5),T.normalMapObjectSpace&&o.enable(6),T.normalMapTangentSpace&&o.enable(7),T.clearcoat&&o.enable(8),T.iridescence&&o.enable(9),T.alphaTest&&o.enable(10),T.vertexColors&&o.enable(11),T.vertexAlphas&&o.enable(12),T.vertexUv1s&&o.enable(13),T.vertexUv2s&&o.enable(14),T.vertexUv3s&&o.enable(15),T.vertexTangents&&o.enable(16),T.anisotropy&&o.enable(17),T.alphaHash&&o.enable(18),T.batching&&o.enable(19),M.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.skinning&&o.enable(4),T.morphTargets&&o.enable(5),T.morphNormals&&o.enable(6),T.morphColors&&o.enable(7),T.premultipliedAlpha&&o.enable(8),T.shadowMapEnabled&&o.enable(9),T.useLegacyLights&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),M.push(o.mask)}function b(M){let T=g[M.type],F;if(T){let X=on[T];F=Pd.clone(X.uniforms)}else F=M.uniforms;return F}function S(M,T){let F;for(let X=0,j=c.length;X<j;X++){let I=c[X];if(I.cacheKey===T){F=I,++F.usedTimes;break}}return F===void 0&&(F=new Hg(i,T,M,r),c.push(F)),F}function R(M){if(--M.usedTimes===0){let T=c.indexOf(M);c[T]=c[c.length-1],c.pop(),M.destroy()}}function w(M){l.remove(M)}function N(){l.dispose()}return{getParameters:f,getProgramCacheKey:p,getUniforms:b,acquireProgram:S,releaseProgram:R,releaseShaderCache:w,programs:c,dispose:N}}function Gg(){let i=new WeakMap;function e(r){let a=i.get(r);return a===void 0&&(a={},i.set(r,a)),a}function t(r){i.delete(r)}function n(r,a,o){i.get(r)[a]=o}function s(){i=new WeakMap}return{get:e,remove:t,update:n,dispose:s}}function Wg(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function rc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function oc(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u,d,m,g,x,f){let p=i[e];return p===void 0?(p={id:u.id,object:u,geometry:d,material:m,groupOrder:g,renderOrder:u.renderOrder,z:x,group:f},i[e]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=m,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=x,p.group=f),e++,p}function o(u,d,m,g,x,f){let p=a(u,d,m,g,x,f);m.transmission>0?n.push(p):m.transparent===!0?s.push(p):t.push(p)}function l(u,d,m,g,x,f){let p=a(u,d,m,g,x,f);m.transmission>0?n.unshift(p):m.transparent===!0?s.unshift(p):t.unshift(p)}function c(u,d){t.length>1&&t.sort(u||Wg),n.length>1&&n.sort(d||rc),s.length>1&&s.sort(d||rc)}function h(){for(let u=e,d=i.length;u<d;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function Xg(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new oc,i.set(n,[a])):s>=r.length?(a=new oc,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Yg(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Xe};break;case"SpotLight":t={position:new L,direction:new L,color:new Xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Xe,groundColor:new Xe};break;case"RectAreaLight":t={color:new Xe,position:new L,halfWidth:new L,halfHeight:new L};break}return i[e.id]=t,t}}}function qg(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}function Zg(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Kg(i,e){let t=new Yg,n=qg(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)s.probe.push(new L);let r=new L,a=new tt,o=new tt;function l(h,u){let d=0,m=0,g=0;for(let X=0;X<9;X++)s.probe[X].set(0,0,0);let x=0,f=0,p=0,y=0,_=0,b=0,S=0,R=0,w=0,N=0,M=0;h.sort(Zg);let T=u===!0?Math.PI:1;for(let X=0,j=h.length;X<j;X++){let I=h[X],U=I.color,G=I.intensity,Y=I.distance,q=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)d+=U.r*G*T,m+=U.g*G*T,g+=U.b*G*T;else if(I.isLightProbe){for(let W=0;W<9;W++)s.probe[W].addScaledVector(I.sh.coefficients[W],G);M++}else if(I.isDirectionalLight){let W=t.get(I);if(W.color.copy(I.color).multiplyScalar(I.intensity*T),I.castShadow){let Q=I.shadow,ne=n.get(I);ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,s.directionalShadow[x]=ne,s.directionalShadowMap[x]=q,s.directionalShadowMatrix[x]=I.shadow.matrix,b++}s.directional[x]=W,x++}else if(I.isSpotLight){let W=t.get(I);W.position.setFromMatrixPosition(I.matrixWorld),W.color.copy(U).multiplyScalar(G*T),W.distance=Y,W.coneCos=Math.cos(I.angle),W.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),W.decay=I.decay,s.spot[p]=W;let Q=I.shadow;if(I.map&&(s.spotLightMap[w]=I.map,w++,Q.updateMatrices(I),I.castShadow&&N++),s.spotLightMatrix[p]=Q.matrix,I.castShadow){let ne=n.get(I);ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,s.spotShadow[p]=ne,s.spotShadowMap[p]=q,R++}p++}else if(I.isRectAreaLight){let W=t.get(I);W.color.copy(U).multiplyScalar(G),W.halfWidth.set(I.width*.5,0,0),W.halfHeight.set(0,I.height*.5,0),s.rectArea[y]=W,y++}else if(I.isPointLight){let W=t.get(I);if(W.color.copy(I.color).multiplyScalar(I.intensity*T),W.distance=I.distance,W.decay=I.decay,I.castShadow){let Q=I.shadow,ne=n.get(I);ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,ne.shadowCameraNear=Q.camera.near,ne.shadowCameraFar=Q.camera.far,s.pointShadow[f]=ne,s.pointShadowMap[f]=q,s.pointShadowMatrix[f]=I.shadow.matrix,S++}s.point[f]=W,f++}else if(I.isHemisphereLight){let W=t.get(I);W.skyColor.copy(I.color).multiplyScalar(G*T),W.groundColor.copy(I.groundColor).multiplyScalar(G*T),s.hemi[_]=W,_++}}y>0&&(e.isWebGL2?i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=le.LTC_FLOAT_1,s.rectAreaLTC2=le.LTC_FLOAT_2):(s.rectAreaLTC1=le.LTC_HALF_1,s.rectAreaLTC2=le.LTC_HALF_2):i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=le.LTC_FLOAT_1,s.rectAreaLTC2=le.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=le.LTC_HALF_1,s.rectAreaLTC2=le.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=d,s.ambient[1]=m,s.ambient[2]=g;let F=s.hash;(F.directionalLength!==x||F.pointLength!==f||F.spotLength!==p||F.rectAreaLength!==y||F.hemiLength!==_||F.numDirectionalShadows!==b||F.numPointShadows!==S||F.numSpotShadows!==R||F.numSpotMaps!==w||F.numLightProbes!==M)&&(s.directional.length=x,s.spot.length=p,s.rectArea.length=y,s.point.length=f,s.hemi.length=_,s.directionalShadow.length=b,s.directionalShadowMap.length=b,s.pointShadow.length=S,s.pointShadowMap.length=S,s.spotShadow.length=R,s.spotShadowMap.length=R,s.directionalShadowMatrix.length=b,s.pointShadowMatrix.length=S,s.spotLightMatrix.length=R+w-N,s.spotLightMap.length=w,s.numSpotLightShadowsWithMaps=N,s.numLightProbes=M,F.directionalLength=x,F.pointLength=f,F.spotLength=p,F.rectAreaLength=y,F.hemiLength=_,F.numDirectionalShadows=b,F.numPointShadows=S,F.numSpotShadows=R,F.numSpotMaps=w,F.numLightProbes=M,s.version=$g++)}function c(h,u){let d=0,m=0,g=0,x=0,f=0,p=u.matrixWorldInverse;for(let y=0,_=h.length;y<_;y++){let b=h[y];if(b.isDirectionalLight){let S=s.directional[d];S.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(p),d++}else if(b.isSpotLight){let S=s.spot[g];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(p),S.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(p),g++}else if(b.isRectAreaLight){let S=s.rectArea[x];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(p),o.identity(),a.copy(b.matrixWorld),a.premultiply(p),o.extractRotation(a),S.halfWidth.set(b.width*.5,0,0),S.halfHeight.set(0,b.height*.5,0),S.halfWidth.applyMatrix4(o),S.halfHeight.applyMatrix4(o),x++}else if(b.isPointLight){let S=s.point[m];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(p),m++}else if(b.isHemisphereLight){let S=s.hemi[f];S.direction.setFromMatrixPosition(b.matrixWorld),S.direction.transformDirection(p),f++}}}return{setup:l,setupView:c,state:s}}function ac(i,e){let t=new Kg(i,e),n=[],s=[];function r(){n.length=0,s.length=0}function a(u){n.push(u)}function o(u){s.push(u)}function l(u){t.setup(n,u)}function c(u){t.setupView(n,u)}return{init:r,state:{lightsArray:n,shadowsArray:s,lights:t},setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function Jg(i,e){let t=new WeakMap;function n(r,a=0){let o=t.get(r),l;return o===void 0?(l=new ac(i,e),t.set(r,[l])):a>=o.length?(l=new ac(i,e),o.push(l)):l=o[a],l}function s(){t=new WeakMap}return{get:n,dispose:s}}function e0(i,e,t){let n=new Oi,s=new Te,r=new Te,a=new gt,o=new Ko({depthPacking:Wu}),l=new Jo,c={},h=t.maxTextureSize,u={[Fn]:It,[It]:Fn,[Jt]:Jt},d=new bn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Te},radius:{value:4}},vertexShader:jg,fragmentShader:Qg}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let g=new ln;g.setAttribute("position",new Bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new Wt(g,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=uc;let p=this.type;this.render=function(R,w,N){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||R.length===0)return;let M=i.getRenderTarget(),T=i.getActiveCubeFace(),F=i.getActiveMipmapLevel(),X=i.state;X.setBlending(Dn),X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);let j=p!==yn&&this.type===yn,I=p===yn&&this.type!==yn;for(let U=0,G=R.length;U<G;U++){let Y=R[U],q=Y.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);let W=q.getFrameExtents();if(s.multiply(W),r.copy(q.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/W.x),s.x=r.x*W.x,q.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/W.y),s.y=r.y*W.y,q.mapSize.y=r.y)),q.map===null||j===!0||I===!0){let ne=this.type!==yn?{minFilter:ot,magFilter:ot}:{};q.map!==null&&q.map.dispose(),q.map=new Mn(s.x,s.y,ne),q.map.texture.name=Y.name+".shadowMap",q.camera.updateProjectionMatrix()}i.setRenderTarget(q.map),i.clear();let Q=q.getViewportCount();for(let ne=0;ne<Q;ne++){let ue=q.getViewport(ne);a.set(r.x*ue.x,r.y*ue.y,r.x*ue.z,r.y*ue.w),X.viewport(a),q.updateMatrices(Y,ne),n=q.getFrustum(),b(w,N,q.camera,Y,this.type)}q.isPointLightShadow!==!0&&this.type===yn&&y(q,N),q.needsUpdate=!1}p=this.type,f.needsUpdate=!1,i.setRenderTarget(M,T,F)};function y(R,w){let N=e.update(x);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,m.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new Mn(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(w,null,N,d,x,null),m.uniforms.shadow_pass.value=R.mapPass.texture,m.uniforms.resolution.value=R.mapSize,m.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(w,null,N,m,x,null)}function _(R,w,N,M){let T=null,F=N.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(F!==void 0)T=F;else if(T=N.isPointLight===!0?l:o,i.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){let X=T.uuid,j=w.uuid,I=c[X];I===void 0&&(I={},c[X]=I);let U=I[j];U===void 0&&(U=T.clone(),I[j]=U,w.addEventListener("dispose",S)),T=U}if(T.visible=w.visible,T.wireframe=w.wireframe,M===yn?T.side=w.shadowSide!==null?w.shadowSide:w.side:T.side=w.shadowSide!==null?w.shadowSide:u[w.side],T.alphaMap=w.alphaMap,T.alphaTest=w.alphaTest,T.map=w.map,T.clipShadows=w.clipShadows,T.clippingPlanes=w.clippingPlanes,T.clipIntersection=w.clipIntersection,T.displacementMap=w.displacementMap,T.displacementScale=w.displacementScale,T.displacementBias=w.displacementBias,T.wireframeLinewidth=w.wireframeLinewidth,T.linewidth=w.linewidth,N.isPointLight===!0&&T.isMeshDistanceMaterial===!0){let X=i.properties.get(T);X.light=N}return T}function b(R,w,N,M,T){if(R.visible===!1)return;if(R.layers.test(w.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&T===yn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,R.matrixWorld);let j=e.update(R),I=R.material;if(Array.isArray(I)){let U=j.groups;for(let G=0,Y=U.length;G<Y;G++){let q=U[G],W=I[q.materialIndex];if(W&&W.visible){let Q=_(R,W,M,T);R.onBeforeShadow(i,R,w,N,j,Q,q),i.renderBufferDirect(N,null,j,Q,R,q),R.onAfterShadow(i,R,w,N,j,Q,q)}}}else if(I.visible){let U=_(R,I,M,T);R.onBeforeShadow(i,R,w,N,j,U,null),i.renderBufferDirect(N,null,j,U,R,null),R.onAfterShadow(i,R,w,N,j,U,null)}}let X=R.children;for(let j=0,I=X.length;j<I;j++)b(X[j],w,N,M,T)}function S(R){R.target.removeEventListener("dispose",S);for(let N in c){let M=c[N],T=R.target.uuid;T in M&&(M[T].dispose(),delete M[T])}}}function t0(i,e,t){let n=t.isWebGL2;function s(){let P=!1,se=new gt,re=null,be=new gt(0,0,0,0);return{setMask:function(ye){re!==ye&&!P&&(i.colorMask(ye,ye,ye,ye),re=ye)},setLocked:function(ye){P=ye},setClear:function(ye,Ye,qe,dt,St){St===!0&&(ye*=dt,Ye*=dt,qe*=dt),se.set(ye,Ye,qe,dt),be.equals(se)===!1&&(i.clearColor(ye,Ye,qe,dt),be.copy(se))},reset:function(){P=!1,re=null,be.set(-1,0,0,0)}}}function r(){let P=!1,se=null,re=null,be=null;return{setTest:function(ye){ye?Pe(i.DEPTH_TEST):Se(i.DEPTH_TEST)},setMask:function(ye){se!==ye&&!P&&(i.depthMask(ye),se=ye)},setFunc:function(ye){if(re!==ye){switch(ye){case yu:i.depthFunc(i.NEVER);break;case vu:i.depthFunc(i.ALWAYS);break;case Mu:i.depthFunc(i.LESS);break;case Ws:i.depthFunc(i.LEQUAL);break;case bu:i.depthFunc(i.EQUAL);break;case Su:i.depthFunc(i.GEQUAL);break;case Eu:i.depthFunc(i.GREATER);break;case wu:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}re=ye}},setLocked:function(ye){P=ye},setClear:function(ye){be!==ye&&(i.clearDepth(ye),be=ye)},reset:function(){P=!1,se=null,re=null,be=null}}}function a(){let P=!1,se=null,re=null,be=null,ye=null,Ye=null,qe=null,dt=null,St=null;return{setTest:function(Ze){P||(Ze?Pe(i.STENCIL_TEST):Se(i.STENCIL_TEST))},setMask:function(Ze){se!==Ze&&!P&&(i.stencilMask(Ze),se=Ze)},setFunc:function(Ze,Et,rn){(re!==Ze||be!==Et||ye!==rn)&&(i.stencilFunc(Ze,Et,rn),re=Ze,be=Et,ye=rn)},setOp:function(Ze,Et,rn){(Ye!==Ze||qe!==Et||dt!==rn)&&(i.stencilOp(Ze,Et,rn),Ye=Ze,qe=Et,dt=rn)},setLocked:function(Ze){P=Ze},setClear:function(Ze){St!==Ze&&(i.clearStencil(Ze),St=Ze)},reset:function(){P=!1,se=null,re=null,be=null,ye=null,Ye=null,qe=null,dt=null,St=null}}}let o=new s,l=new r,c=new a,h=new WeakMap,u=new WeakMap,d={},m={},g=new WeakMap,x=[],f=null,p=!1,y=null,_=null,b=null,S=null,R=null,w=null,N=null,M=new Xe(0,0,0),T=0,F=!1,X=null,j=null,I=null,U=null,G=null,Y=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),q=!1,W=0,Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?(W=parseFloat(/^WebGL (\d)/.exec(Q)[1]),q=W>=1):Q.indexOf("OpenGL ES")!==-1&&(W=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),q=W>=2);let ne=null,ue={},V=i.getParameter(i.SCISSOR_BOX),Z=i.getParameter(i.VIEWPORT),he=new gt().fromArray(V),_e=new gt().fromArray(Z);function ge(P,se,re,be){let ye=new Uint8Array(4),Ye=i.createTexture();i.bindTexture(P,Ye),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let qe=0;qe<re;qe++)n&&(P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY)?i.texImage3D(se,0,i.RGBA,1,1,be,0,i.RGBA,i.UNSIGNED_BYTE,ye):i.texImage2D(se+qe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ye);return Ye}let Ce={};Ce[i.TEXTURE_2D]=ge(i.TEXTURE_2D,i.TEXTURE_2D,1),Ce[i.TEXTURE_CUBE_MAP]=ge(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(Ce[i.TEXTURE_2D_ARRAY]=ge(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ce[i.TEXTURE_3D]=ge(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Pe(i.DEPTH_TEST),l.setFunc(Ws),Ie(!1),A(Wa),Pe(i.CULL_FACE),pe(Dn);function Pe(P){d[P]!==!0&&(i.enable(P),d[P]=!0)}function Se(P){d[P]!==!1&&(i.disable(P),d[P]=!1)}function Ve(P,se){return m[P]!==se?(i.bindFramebuffer(P,se),m[P]=se,n&&(P===i.DRAW_FRAMEBUFFER&&(m[i.FRAMEBUFFER]=se),P===i.FRAMEBUFFER&&(m[i.DRAW_FRAMEBUFFER]=se)),!0):!1}function O(P,se){let re=x,be=!1;if(P)if(re=g.get(se),re===void 0&&(re=[],g.set(se,re)),P.isWebGLMultipleRenderTargets){let ye=P.texture;if(re.length!==ye.length||re[0]!==i.COLOR_ATTACHMENT0){for(let Ye=0,qe=ye.length;Ye<qe;Ye++)re[Ye]=i.COLOR_ATTACHMENT0+Ye;re.length=ye.length,be=!0}}else re[0]!==i.COLOR_ATTACHMENT0&&(re[0]=i.COLOR_ATTACHMENT0,be=!0);else re[0]!==i.BACK&&(re[0]=i.BACK,be=!0);be&&(t.isWebGL2?i.drawBuffers(re):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(re))}function ut(P){return f!==P?(i.useProgram(P),f=P,!0):!1}let Me={[Zn]:i.FUNC_ADD,[su]:i.FUNC_SUBTRACT,[ru]:i.FUNC_REVERSE_SUBTRACT};if(n)Me[$a]=i.MIN,Me[Za]=i.MAX;else{let P=e.get("EXT_blend_minmax");P!==null&&(Me[$a]=P.MIN_EXT,Me[Za]=P.MAX_EXT)}let Ae={[ou]:i.ZERO,[au]:i.ONE,[lu]:i.SRC_COLOR,[Po]:i.SRC_ALPHA,[pu]:i.SRC_ALPHA_SATURATE,[du]:i.DST_COLOR,[hu]:i.DST_ALPHA,[cu]:i.ONE_MINUS_SRC_COLOR,[Io]:i.ONE_MINUS_SRC_ALPHA,[fu]:i.ONE_MINUS_DST_COLOR,[uu]:i.ONE_MINUS_DST_ALPHA,[mu]:i.CONSTANT_COLOR,[gu]:i.ONE_MINUS_CONSTANT_COLOR,[xu]:i.CONSTANT_ALPHA,[_u]:i.ONE_MINUS_CONSTANT_ALPHA};function pe(P,se,re,be,ye,Ye,qe,dt,St,Ze){if(P===Dn){p===!0&&(Se(i.BLEND),p=!1);return}if(p===!1&&(Pe(i.BLEND),p=!0),P!==iu){if(P!==y||Ze!==F){if((_!==Zn||R!==Zn)&&(i.blendEquation(i.FUNC_ADD),_=Zn,R=Zn),Ze)switch(P){case Ri:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Xa:i.blendFunc(i.ONE,i.ONE);break;case Ya:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case qa:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case Ri:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Xa:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ya:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case qa:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}b=null,S=null,w=null,N=null,M.set(0,0,0),T=0,y=P,F=Ze}return}ye=ye||se,Ye=Ye||re,qe=qe||be,(se!==_||ye!==R)&&(i.blendEquationSeparate(Me[se],Me[ye]),_=se,R=ye),(re!==b||be!==S||Ye!==w||qe!==N)&&(i.blendFuncSeparate(Ae[re],Ae[be],Ae[Ye],Ae[qe]),b=re,S=be,w=Ye,N=qe),(dt.equals(M)===!1||St!==T)&&(i.blendColor(dt.r,dt.g,dt.b,St),M.copy(dt),T=St),y=P,F=!1}function Ke(P,se){P.side===Jt?Se(i.CULL_FACE):Pe(i.CULL_FACE);let re=P.side===It;se&&(re=!re),Ie(re),P.blending===Ri&&P.transparent===!1?pe(Dn):pe(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),l.setFunc(P.depthFunc),l.setTest(P.depthTest),l.setMask(P.depthWrite),o.setMask(P.colorWrite);let be=P.stencilWrite;c.setTest(be),be&&(c.setMask(P.stencilWriteMask),c.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),c.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),B(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?Pe(i.SAMPLE_ALPHA_TO_COVERAGE):Se(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ie(P){X!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),X=P)}function A(P){P!==eu?(Pe(i.CULL_FACE),P!==j&&(P===Wa?i.cullFace(i.BACK):P===tu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Se(i.CULL_FACE),j=P}function v(P){P!==I&&(q&&i.lineWidth(P),I=P)}function B(P,se,re){P?(Pe(i.POLYGON_OFFSET_FILL),(U!==se||G!==re)&&(i.polygonOffset(se,re),U=se,G=re)):Se(i.POLYGON_OFFSET_FILL)}function te(P){P?Pe(i.SCISSOR_TEST):Se(i.SCISSOR_TEST)}function J(P){P===void 0&&(P=i.TEXTURE0+Y-1),ne!==P&&(i.activeTexture(P),ne=P)}function ee(P,se,re){re===void 0&&(ne===null?re=i.TEXTURE0+Y-1:re=ne);let be=ue[re];be===void 0&&(be={type:void 0,texture:void 0},ue[re]=be),(be.type!==P||be.texture!==se)&&(ne!==re&&(i.activeTexture(re),ne=re),i.bindTexture(P,se||Ce[P]),be.type=P,be.texture=se)}function me(){let P=ue[ne];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function ce(){try{i.compressedTexImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function fe(){try{i.compressedTexImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ee(){try{i.texSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function De(){try{i.texSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function K(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ge(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function C(){try{i.texStorage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function $(){try{i.texStorage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ae(){try{i.texImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ie(){try{i.texImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function xe(P){he.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),he.copy(P))}function ze(P){_e.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),_e.copy(P))}function We(P,se){let re=u.get(se);re===void 0&&(re=new WeakMap,u.set(se,re));let be=re.get(P);be===void 0&&(be=i.getUniformBlockIndex(se,P.name),re.set(P,be))}function Oe(P,se){let be=u.get(se).get(P);h.get(se)!==be&&(i.uniformBlockBinding(se,be,P.__bindingPointIndex),h.set(se,be))}function oe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),n===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),d={},ne=null,ue={},m={},g=new WeakMap,x=[],f=null,p=!1,y=null,_=null,b=null,S=null,R=null,w=null,N=null,M=new Xe(0,0,0),T=0,F=!1,X=null,j=null,I=null,U=null,G=null,he.set(0,0,i.canvas.width,i.canvas.height),_e.set(0,0,i.canvas.width,i.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:Pe,disable:Se,bindFramebuffer:Ve,drawBuffers:O,useProgram:ut,setBlending:pe,setMaterial:Ke,setFlipSided:Ie,setCullFace:A,setLineWidth:v,setPolygonOffset:B,setScissorTest:te,activeTexture:J,bindTexture:ee,unbindTexture:me,compressedTexImage2D:ce,compressedTexImage3D:fe,texImage2D:ae,texImage3D:ie,updateUBOMapping:We,uniformBlockBinding:Oe,texStorage2D:C,texStorage3D:$,texSubImage2D:Ee,texSubImage3D:De,compressedTexSubImage2D:K,compressedTexSubImage3D:Ge,scissor:xe,viewport:ze,reset:oe}}function n0(i,e,t,n,s,r,a){let o=s.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap,u,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,v){return m?new OffscreenCanvas(A,v):nr("canvas")}function x(A,v,B,te){let J=1;if((A.width>te||A.height>te)&&(J=te/Math.max(A.width,A.height)),J<1||v===!0)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){let ee=v?tr:Math.floor,me=ee(J*A.width),ce=ee(J*A.height);u===void 0&&(u=g(me,ce));let fe=B?g(me,ce):u;return fe.width=me,fe.height=ce,fe.getContext("2d").drawImage(A,0,0,me,ce),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+A.width+"x"+A.height+") to ("+me+"x"+ce+")."),fe}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+A.width+"x"+A.height+")."),A;return A}function f(A){return Oo(A.width)&&Oo(A.height)}function p(A){return o?!1:A.wrapS!==jt||A.wrapT!==jt||A.minFilter!==ot&&A.minFilter!==At}function y(A,v){return A.generateMipmaps&&v&&A.minFilter!==ot&&A.minFilter!==At}function _(A){i.generateMipmap(A)}function b(A,v,B,te,J=!1){if(o===!1)return v;if(A!==null){if(i[A]!==void 0)return i[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ee=v;if(v===i.RED&&(B===i.FLOAT&&(ee=i.R32F),B===i.HALF_FLOAT&&(ee=i.R16F),B===i.UNSIGNED_BYTE&&(ee=i.R8)),v===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(ee=i.R8UI),B===i.UNSIGNED_SHORT&&(ee=i.R16UI),B===i.UNSIGNED_INT&&(ee=i.R32UI),B===i.BYTE&&(ee=i.R8I),B===i.SHORT&&(ee=i.R16I),B===i.INT&&(ee=i.R32I)),v===i.RG&&(B===i.FLOAT&&(ee=i.RG32F),B===i.HALF_FLOAT&&(ee=i.RG16F),B===i.UNSIGNED_BYTE&&(ee=i.RG8)),v===i.RGBA){let me=J?Js:$e.getTransfer(te);B===i.FLOAT&&(ee=i.RGBA32F),B===i.HALF_FLOAT&&(ee=i.RGBA16F),B===i.UNSIGNED_BYTE&&(ee=me===Je?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT_4_4_4_4&&(ee=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(ee=i.RGB5_A1)}return(ee===i.R16F||ee===i.R32F||ee===i.RG16F||ee===i.RG32F||ee===i.RGBA16F||ee===i.RGBA32F)&&e.get("EXT_color_buffer_float"),ee}function S(A,v,B){return y(A,B)===!0||A.isFramebufferTexture&&A.minFilter!==ot&&A.minFilter!==At?Math.log2(Math.max(v.width,v.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?v.mipmaps.length:1}function R(A){return A===ot||A===Ka||A===no?i.NEAREST:i.LINEAR}function w(A){let v=A.target;v.removeEventListener("dispose",w),M(v),v.isVideoTexture&&h.delete(v)}function N(A){let v=A.target;v.removeEventListener("dispose",N),F(v)}function M(A){let v=n.get(A);if(v.__webglInit===void 0)return;let B=A.source,te=d.get(B);if(te){let J=te[v.__cacheKey];J.usedTimes--,J.usedTimes===0&&T(A),Object.keys(te).length===0&&d.delete(B)}n.remove(A)}function T(A){let v=n.get(A);i.deleteTexture(v.__webglTexture);let B=A.source,te=d.get(B);delete te[v.__cacheKey],a.memory.textures--}function F(A){let v=A.texture,B=n.get(A),te=n.get(v);if(te.__webglTexture!==void 0&&(i.deleteTexture(te.__webglTexture),a.memory.textures--),A.depthTexture&&A.depthTexture.dispose(),A.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(B.__webglFramebuffer[J]))for(let ee=0;ee<B.__webglFramebuffer[J].length;ee++)i.deleteFramebuffer(B.__webglFramebuffer[J][ee]);else i.deleteFramebuffer(B.__webglFramebuffer[J]);B.__webglDepthbuffer&&i.deleteRenderbuffer(B.__webglDepthbuffer[J])}else{if(Array.isArray(B.__webglFramebuffer))for(let J=0;J<B.__webglFramebuffer.length;J++)i.deleteFramebuffer(B.__webglFramebuffer[J]);else i.deleteFramebuffer(B.__webglFramebuffer);if(B.__webglDepthbuffer&&i.deleteRenderbuffer(B.__webglDepthbuffer),B.__webglMultisampledFramebuffer&&i.deleteFramebuffer(B.__webglMultisampledFramebuffer),B.__webglColorRenderbuffer)for(let J=0;J<B.__webglColorRenderbuffer.length;J++)B.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(B.__webglColorRenderbuffer[J]);B.__webglDepthRenderbuffer&&i.deleteRenderbuffer(B.__webglDepthRenderbuffer)}if(A.isWebGLMultipleRenderTargets)for(let J=0,ee=v.length;J<ee;J++){let me=n.get(v[J]);me.__webglTexture&&(i.deleteTexture(me.__webglTexture),a.memory.textures--),n.remove(v[J])}n.remove(v),n.remove(A)}let X=0;function j(){X=0}function I(){let A=X;return A>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),X+=1,A}function U(A){let v=[];return v.push(A.wrapS),v.push(A.wrapT),v.push(A.wrapR||0),v.push(A.magFilter),v.push(A.minFilter),v.push(A.anisotropy),v.push(A.internalFormat),v.push(A.format),v.push(A.type),v.push(A.generateMipmaps),v.push(A.premultiplyAlpha),v.push(A.flipY),v.push(A.unpackAlignment),v.push(A.colorSpace),v.join()}function G(A,v){let B=n.get(A);if(A.isVideoTexture&&Ke(A),A.isRenderTargetTexture===!1&&A.version>0&&B.__version!==A.version){let te=A.image;if(te===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(te.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{he(B,A,v);return}}t.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+v)}function Y(A,v){let B=n.get(A);if(A.version>0&&B.__version!==A.version){he(B,A,v);return}t.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+v)}function q(A,v){let B=n.get(A);if(A.version>0&&B.__version!==A.version){he(B,A,v);return}t.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+v)}function W(A,v){let B=n.get(A);if(A.version>0&&B.__version!==A.version){_e(B,A,v);return}t.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+v)}let Q={[No]:i.REPEAT,[jt]:i.CLAMP_TO_EDGE,[Uo]:i.MIRRORED_REPEAT},ne={[ot]:i.NEAREST,[Ka]:i.NEAREST_MIPMAP_NEAREST,[no]:i.NEAREST_MIPMAP_LINEAR,[At]:i.LINEAR,[Nu]:i.LINEAR_MIPMAP_NEAREST,[ei]:i.LINEAR_MIPMAP_LINEAR},ue={[qu]:i.NEVER,[Qu]:i.ALWAYS,[$u]:i.LESS,[Mc]:i.LEQUAL,[Zu]:i.EQUAL,[ju]:i.GEQUAL,[Ku]:i.GREATER,[Ju]:i.NOTEQUAL};function V(A,v,B){if(B?(i.texParameteri(A,i.TEXTURE_WRAP_S,Q[v.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,Q[v.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,Q[v.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,ne[v.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,ne[v.minFilter])):(i.texParameteri(A,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(A,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(v.wrapS!==jt||v.wrapT!==jt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(A,i.TEXTURE_MAG_FILTER,R(v.magFilter)),i.texParameteri(A,i.TEXTURE_MIN_FILTER,R(v.minFilter)),v.minFilter!==ot&&v.minFilter!==At&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),v.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,ue[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){let te=e.get("EXT_texture_filter_anisotropic");if(v.magFilter===ot||v.minFilter!==no&&v.minFilter!==ei||v.type===Ln&&e.has("OES_texture_float_linear")===!1||o===!1&&v.type===is&&e.has("OES_texture_half_float_linear")===!1)return;(v.anisotropy>1||n.get(v).__currentAnisotropy)&&(i.texParameterf(A,te.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy)}}function Z(A,v){let B=!1;A.__webglInit===void 0&&(A.__webglInit=!0,v.addEventListener("dispose",w));let te=v.source,J=d.get(te);J===void 0&&(J={},d.set(te,J));let ee=U(v);if(ee!==A.__cacheKey){J[ee]===void 0&&(J[ee]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,B=!0),J[ee].usedTimes++;let me=J[A.__cacheKey];me!==void 0&&(J[A.__cacheKey].usedTimes--,me.usedTimes===0&&T(v)),A.__cacheKey=ee,A.__webglTexture=J[ee].texture}return B}function he(A,v,B){let te=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(te=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(te=i.TEXTURE_3D);let J=Z(A,v),ee=v.source;t.bindTexture(te,A.__webglTexture,i.TEXTURE0+B);let me=n.get(ee);if(ee.version!==me.__version||J===!0){t.activeTexture(i.TEXTURE0+B);let ce=$e.getPrimaries($e.workingColorSpace),fe=v.colorSpace===Gt?null:$e.getPrimaries(v.colorSpace),Ee=v.colorSpace===Gt||ce===fe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);let De=p(v)&&f(v.image)===!1,K=x(v.image,De,!1,s.maxTextureSize);K=Ie(v,K);let Ge=f(K)||o,C=r.convert(v.format,v.colorSpace),$=r.convert(v.type),ae=b(v.internalFormat,C,$,v.colorSpace,v.isVideoTexture);V(te,v,Ge);let ie,xe=v.mipmaps,ze=o&&v.isVideoTexture!==!0&&ae!==vr,We=me.__version===void 0||J===!0,Oe=S(v,K,Ge);if(v.isDepthTexture)ae=i.DEPTH_COMPONENT,o?v.type===Ln?ae=i.DEPTH_COMPONENT32F:v.type===In?ae=i.DEPTH_COMPONENT24:v.type===Jn?ae=i.DEPTH24_STENCIL8:ae=i.DEPTH_COMPONENT16:v.type===Ln&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),v.format===jn&&ae===i.DEPTH_COMPONENT&&v.type!==da&&v.type!==In&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),v.type=In,$=r.convert(v.type)),v.format===Di&&ae===i.DEPTH_COMPONENT&&(ae=i.DEPTH_STENCIL,v.type!==Jn&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),v.type=Jn,$=r.convert(v.type))),We&&(ze?t.texStorage2D(i.TEXTURE_2D,1,ae,K.width,K.height):t.texImage2D(i.TEXTURE_2D,0,ae,K.width,K.height,0,C,$,null));else if(v.isDataTexture)if(xe.length>0&&Ge){ze&&We&&t.texStorage2D(i.TEXTURE_2D,Oe,ae,xe[0].width,xe[0].height);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],ze?t.texSubImage2D(i.TEXTURE_2D,oe,0,0,ie.width,ie.height,C,$,ie.data):t.texImage2D(i.TEXTURE_2D,oe,ae,ie.width,ie.height,0,C,$,ie.data);v.generateMipmaps=!1}else ze?(We&&t.texStorage2D(i.TEXTURE_2D,Oe,ae,K.width,K.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,K.width,K.height,C,$,K.data)):t.texImage2D(i.TEXTURE_2D,0,ae,K.width,K.height,0,C,$,K.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){ze&&We&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Oe,ae,xe[0].width,xe[0].height,K.depth);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],v.format!==Ot?C!==null?ze?t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,oe,0,0,0,ie.width,ie.height,K.depth,C,ie.data,0,0):t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,oe,ae,ie.width,ie.height,K.depth,0,ie.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ze?t.texSubImage3D(i.TEXTURE_2D_ARRAY,oe,0,0,0,ie.width,ie.height,K.depth,C,$,ie.data):t.texImage3D(i.TEXTURE_2D_ARRAY,oe,ae,ie.width,ie.height,K.depth,0,C,$,ie.data)}else{ze&&We&&t.texStorage2D(i.TEXTURE_2D,Oe,ae,xe[0].width,xe[0].height);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],v.format!==Ot?C!==null?ze?t.compressedTexSubImage2D(i.TEXTURE_2D,oe,0,0,ie.width,ie.height,C,ie.data):t.compressedTexImage2D(i.TEXTURE_2D,oe,ae,ie.width,ie.height,0,ie.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ze?t.texSubImage2D(i.TEXTURE_2D,oe,0,0,ie.width,ie.height,C,$,ie.data):t.texImage2D(i.TEXTURE_2D,oe,ae,ie.width,ie.height,0,C,$,ie.data)}else if(v.isDataArrayTexture)ze?(We&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Oe,ae,K.width,K.height,K.depth),t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,C,$,K.data)):t.texImage3D(i.TEXTURE_2D_ARRAY,0,ae,K.width,K.height,K.depth,0,C,$,K.data);else if(v.isData3DTexture)ze?(We&&t.texStorage3D(i.TEXTURE_3D,Oe,ae,K.width,K.height,K.depth),t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,C,$,K.data)):t.texImage3D(i.TEXTURE_3D,0,ae,K.width,K.height,K.depth,0,C,$,K.data);else if(v.isFramebufferTexture){if(We)if(ze)t.texStorage2D(i.TEXTURE_2D,Oe,ae,K.width,K.height);else{let oe=K.width,P=K.height;for(let se=0;se<Oe;se++)t.texImage2D(i.TEXTURE_2D,se,ae,oe,P,0,C,$,null),oe>>=1,P>>=1}}else if(xe.length>0&&Ge){ze&&We&&t.texStorage2D(i.TEXTURE_2D,Oe,ae,xe[0].width,xe[0].height);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],ze?t.texSubImage2D(i.TEXTURE_2D,oe,0,0,C,$,ie):t.texImage2D(i.TEXTURE_2D,oe,ae,C,$,ie);v.generateMipmaps=!1}else ze?(We&&t.texStorage2D(i.TEXTURE_2D,Oe,ae,K.width,K.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,C,$,K)):t.texImage2D(i.TEXTURE_2D,0,ae,C,$,K);y(v,Ge)&&_(te),me.__version=ee.version,v.onUpdate&&v.onUpdate(v)}A.__version=v.version}function _e(A,v,B){if(v.image.length!==6)return;let te=Z(A,v),J=v.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+B);let ee=n.get(J);if(J.version!==ee.__version||te===!0){t.activeTexture(i.TEXTURE0+B);let me=$e.getPrimaries($e.workingColorSpace),ce=v.colorSpace===Gt?null:$e.getPrimaries(v.colorSpace),fe=v.colorSpace===Gt||me===ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);let Ee=v.isCompressedTexture||v.image[0].isCompressedTexture,De=v.image[0]&&v.image[0].isDataTexture,K=[];for(let oe=0;oe<6;oe++)!Ee&&!De?K[oe]=x(v.image[oe],!1,!0,s.maxCubemapSize):K[oe]=De?v.image[oe].image:v.image[oe],K[oe]=Ie(v,K[oe]);let Ge=K[0],C=f(Ge)||o,$=r.convert(v.format,v.colorSpace),ae=r.convert(v.type),ie=b(v.internalFormat,$,ae,v.colorSpace),xe=o&&v.isVideoTexture!==!0,ze=ee.__version===void 0||te===!0,We=S(v,Ge,C);V(i.TEXTURE_CUBE_MAP,v,C);let Oe;if(Ee){xe&&ze&&t.texStorage2D(i.TEXTURE_CUBE_MAP,We,ie,Ge.width,Ge.height);for(let oe=0;oe<6;oe++){Oe=K[oe].mipmaps;for(let P=0;P<Oe.length;P++){let se=Oe[P];v.format!==Ot?$!==null?xe?t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,0,0,se.width,se.height,$,se.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,ie,se.width,se.height,0,se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):xe?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,0,0,se.width,se.height,$,ae,se.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,ie,se.width,se.height,0,$,ae,se.data)}}}else{Oe=v.mipmaps,xe&&ze&&(Oe.length>0&&We++,t.texStorage2D(i.TEXTURE_CUBE_MAP,We,ie,K[0].width,K[0].height));for(let oe=0;oe<6;oe++)if(De){xe?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,K[oe].width,K[oe].height,$,ae,K[oe].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,ie,K[oe].width,K[oe].height,0,$,ae,K[oe].data);for(let P=0;P<Oe.length;P++){let re=Oe[P].image[oe].image;xe?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,0,0,re.width,re.height,$,ae,re.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,ie,re.width,re.height,0,$,ae,re.data)}}else{xe?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,$,ae,K[oe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,ie,$,ae,K[oe]);for(let P=0;P<Oe.length;P++){let se=Oe[P];xe?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,0,0,$,ae,se.image[oe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,ie,$,ae,se.image[oe])}}}y(v,C)&&_(i.TEXTURE_CUBE_MAP),ee.__version=J.version,v.onUpdate&&v.onUpdate(v)}A.__version=v.version}function ge(A,v,B,te,J,ee){let me=r.convert(B.format,B.colorSpace),ce=r.convert(B.type),fe=b(B.internalFormat,me,ce,B.colorSpace);if(!n.get(v).__hasExternalTextures){let De=Math.max(1,v.width>>ee),K=Math.max(1,v.height>>ee);J===i.TEXTURE_3D||J===i.TEXTURE_2D_ARRAY?t.texImage3D(J,ee,fe,De,K,v.depth,0,me,ce,null):t.texImage2D(J,ee,fe,De,K,0,me,ce,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),pe(v)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,te,J,n.get(B).__webglTexture,0,Ae(v)):(J===i.TEXTURE_2D||J>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,te,J,n.get(B).__webglTexture,ee),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ce(A,v,B){if(i.bindRenderbuffer(i.RENDERBUFFER,A),v.depthBuffer&&!v.stencilBuffer){let te=o===!0?i.DEPTH_COMPONENT24:i.DEPTH_COMPONENT16;if(B||pe(v)){let J=v.depthTexture;J&&J.isDepthTexture&&(J.type===Ln?te=i.DEPTH_COMPONENT32F:J.type===In&&(te=i.DEPTH_COMPONENT24));let ee=Ae(v);pe(v)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ee,te,v.width,v.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,ee,te,v.width,v.height)}else i.renderbufferStorage(i.RENDERBUFFER,te,v.width,v.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,A)}else if(v.depthBuffer&&v.stencilBuffer){let te=Ae(v);B&&pe(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,te,i.DEPTH24_STENCIL8,v.width,v.height):pe(v)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,te,i.DEPTH24_STENCIL8,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,A)}else{let te=v.isWebGLMultipleRenderTargets===!0?v.texture:[v.texture];for(let J=0;J<te.length;J++){let ee=te[J],me=r.convert(ee.format,ee.colorSpace),ce=r.convert(ee.type),fe=b(ee.internalFormat,me,ce,ee.colorSpace),Ee=Ae(v);B&&pe(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ee,fe,v.width,v.height):pe(v)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ee,fe,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,fe,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Pe(A,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(v.depthTexture).__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),G(v.depthTexture,0);let te=n.get(v.depthTexture).__webglTexture,J=Ae(v);if(v.depthTexture.format===jn)pe(v)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,te,0,J):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,te,0);else if(v.depthTexture.format===Di)pe(v)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,te,0,J):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,te,0);else throw new Error("Unknown depthTexture format")}function Se(A){let v=n.get(A),B=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!v.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");Pe(v.__webglFramebuffer,A)}else if(B){v.__webglDepthbuffer=[];for(let te=0;te<6;te++)t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[te]),v.__webglDepthbuffer[te]=i.createRenderbuffer(),Ce(v.__webglDepthbuffer[te],A,!1)}else t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer=i.createRenderbuffer(),Ce(v.__webglDepthbuffer,A,!1);t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ve(A,v,B){let te=n.get(A);v!==void 0&&ge(te.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&Se(A)}function O(A){let v=A.texture,B=n.get(A),te=n.get(v);A.addEventListener("dispose",N),A.isWebGLMultipleRenderTargets!==!0&&(te.__webglTexture===void 0&&(te.__webglTexture=i.createTexture()),te.__version=v.version,a.memory.textures++);let J=A.isWebGLCubeRenderTarget===!0,ee=A.isWebGLMultipleRenderTargets===!0,me=f(A)||o;if(J){B.__webglFramebuffer=[];for(let ce=0;ce<6;ce++)if(o&&v.mipmaps&&v.mipmaps.length>0){B.__webglFramebuffer[ce]=[];for(let fe=0;fe<v.mipmaps.length;fe++)B.__webglFramebuffer[ce][fe]=i.createFramebuffer()}else B.__webglFramebuffer[ce]=i.createFramebuffer()}else{if(o&&v.mipmaps&&v.mipmaps.length>0){B.__webglFramebuffer=[];for(let ce=0;ce<v.mipmaps.length;ce++)B.__webglFramebuffer[ce]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(ee)if(s.drawBuffers){let ce=A.texture;for(let fe=0,Ee=ce.length;fe<Ee;fe++){let De=n.get(ce[fe]);De.__webglTexture===void 0&&(De.__webglTexture=i.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&A.samples>0&&pe(A)===!1){let ce=ee?v:[v];B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let fe=0;fe<ce.length;fe++){let Ee=ce[fe];B.__webglColorRenderbuffer[fe]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[fe]);let De=r.convert(Ee.format,Ee.colorSpace),K=r.convert(Ee.type),Ge=b(Ee.internalFormat,De,K,Ee.colorSpace,A.isXRRenderTarget===!0),C=Ae(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,C,Ge,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,B.__webglColorRenderbuffer[fe])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),Ce(B.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(J){t.bindTexture(i.TEXTURE_CUBE_MAP,te.__webglTexture),V(i.TEXTURE_CUBE_MAP,v,me);for(let ce=0;ce<6;ce++)if(o&&v.mipmaps&&v.mipmaps.length>0)for(let fe=0;fe<v.mipmaps.length;fe++)ge(B.__webglFramebuffer[ce][fe],A,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,fe);else ge(B.__webglFramebuffer[ce],A,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0);y(v,me)&&_(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ee){let ce=A.texture;for(let fe=0,Ee=ce.length;fe<Ee;fe++){let De=ce[fe],K=n.get(De);t.bindTexture(i.TEXTURE_2D,K.__webglTexture),V(i.TEXTURE_2D,De,me),ge(B.__webglFramebuffer,A,De,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,0),y(De,me)&&_(i.TEXTURE_2D)}t.unbindTexture()}else{let ce=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(o?ce=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(ce,te.__webglTexture),V(ce,v,me),o&&v.mipmaps&&v.mipmaps.length>0)for(let fe=0;fe<v.mipmaps.length;fe++)ge(B.__webglFramebuffer[fe],A,v,i.COLOR_ATTACHMENT0,ce,fe);else ge(B.__webglFramebuffer,A,v,i.COLOR_ATTACHMENT0,ce,0);y(v,me)&&_(ce),t.unbindTexture()}A.depthBuffer&&Se(A)}function ut(A){let v=f(A)||o,B=A.isWebGLMultipleRenderTargets===!0?A.texture:[A.texture];for(let te=0,J=B.length;te<J;te++){let ee=B[te];if(y(ee,v)){let me=A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,ce=n.get(ee).__webglTexture;t.bindTexture(me,ce),_(me),t.unbindTexture()}}}function Me(A){if(o&&A.samples>0&&pe(A)===!1){let v=A.isWebGLMultipleRenderTargets?A.texture:[A.texture],B=A.width,te=A.height,J=i.COLOR_BUFFER_BIT,ee=[],me=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=n.get(A),fe=A.isWebGLMultipleRenderTargets===!0;if(fe)for(let Ee=0;Ee<v.length;Ee++)t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let Ee=0;Ee<v.length;Ee++){ee.push(i.COLOR_ATTACHMENT0+Ee),A.depthBuffer&&ee.push(me);let De=ce.__ignoreDepthValues!==void 0?ce.__ignoreDepthValues:!1;if(De===!1&&(A.depthBuffer&&(J|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&(J|=i.STENCIL_BUFFER_BIT)),fe&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ce.__webglColorRenderbuffer[Ee]),De===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[me]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[me])),fe){let K=n.get(v[Ee]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,K,0)}i.blitFramebuffer(0,0,B,te,0,0,B,te,J,i.NEAREST),c&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ee)}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),fe)for(let Ee=0;Ee<v.length;Ee++){t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.RENDERBUFFER,ce.__webglColorRenderbuffer[Ee]);let De=n.get(v[Ee]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ee,i.TEXTURE_2D,De,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}}function Ae(A){return Math.min(s.maxSamples,A.samples)}function pe(A){let v=n.get(A);return o&&A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Ke(A){let v=a.render.frame;h.get(A)!==v&&(h.set(A,v),A.update())}function Ie(A,v){let B=A.colorSpace,te=A.format,J=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||A.format===Fo||B!==en&&B!==Gt&&($e.getTransfer(B)===Je?o===!1?e.has("EXT_sRGB")===!0&&te===Ot?(A.format=Fo,A.minFilter=At,A.generateMipmaps=!1):v=ir.sRGBToLinear(v):(te!==Ot||J!==Un)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),v}this.allocateTextureUnit=I,this.resetTextureUnits=j,this.setTexture2D=G,this.setTexture2DArray=Y,this.setTexture3D=q,this.setTextureCube=W,this.rebindTextures=Ve,this.setupRenderTarget=O,this.updateRenderTargetMipmap=ut,this.updateMultisampleRenderTarget=Me,this.setupDepthRenderbuffer=Se,this.setupFrameBufferTexture=ge,this.useMultisampledRTT=pe}function i0(i,e,t){let n=t.isWebGL2;function s(r,a=Gt){let o,l=$e.getTransfer(a);if(r===Un)return i.UNSIGNED_BYTE;if(r===mc)return i.UNSIGNED_SHORT_4_4_4_4;if(r===gc)return i.UNSIGNED_SHORT_5_5_5_1;if(r===Uu)return i.BYTE;if(r===Fu)return i.SHORT;if(r===da)return i.UNSIGNED_SHORT;if(r===pc)return i.INT;if(r===In)return i.UNSIGNED_INT;if(r===Ln)return i.FLOAT;if(r===is)return n?i.HALF_FLOAT:(o=e.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(r===Ou)return i.ALPHA;if(r===Ot)return i.RGBA;if(r===Bu)return i.LUMINANCE;if(r===zu)return i.LUMINANCE_ALPHA;if(r===jn)return i.DEPTH_COMPONENT;if(r===Di)return i.DEPTH_STENCIL;if(r===Fo)return o=e.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(r===Hu)return i.RED;if(r===xc)return i.RED_INTEGER;if(r===ku)return i.RG;if(r===_c)return i.RG_INTEGER;if(r===yc)return i.RGBA_INTEGER;if(r===Ji||r===io||r===so||r===ro)if(l===Je)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(r===Ji)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===io)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===so)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===ro)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(r===Ji)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===io)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===so)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===ro)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Xs||r===Ja||r===ja||r===Qa)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(r===Xs)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Ja)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===ja)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Qa)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===vr)return o=e.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===el||r===tl)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(r===el)return l===Je?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(r===tl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===Ys||r===nl||r===il||r===sl||r===qs||r===rl||r===$s||r===ol||r===al||r===ll||r===cl||r===hl||r===ul||r===dl)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(r===Ys)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===nl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===il)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===sl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===qs)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===rl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===$s)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===ol)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===al)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===ll)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===cl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===hl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===ul)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===dl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===ji||r===fl||r===pl)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(r===ji)return l===Je?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===fl)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===pl)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===Vu||r===ml||r===gl||r===xl)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(r===ji)return o.COMPRESSED_RED_RGTC1_EXT;if(r===ml)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===gl)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===xl)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Jn?n?i.UNSIGNED_INT_24_8:(o=e.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):i[r]!==void 0?i[r]:null}return{convert:s}}function r0(i,e){function t(f,p){f.matrixAutoUpdate===!0&&f.updateMatrix(),p.value.copy(f.matrix)}function n(f,p){p.color.getRGB(f.fogColor.value,wc(i)),p.isFog?(f.fogNear.value=p.near,f.fogFar.value=p.far):p.isFogExp2&&(f.fogDensity.value=p.density)}function s(f,p,y,_,b){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(f,p):p.isMeshToonMaterial?(r(f,p),u(f,p)):p.isMeshPhongMaterial?(r(f,p),h(f,p)):p.isMeshStandardMaterial?(r(f,p),d(f,p),p.isMeshPhysicalMaterial&&m(f,p,b)):p.isMeshMatcapMaterial?(r(f,p),g(f,p)):p.isMeshDepthMaterial?r(f,p):p.isMeshDistanceMaterial?(r(f,p),x(f,p)):p.isMeshNormalMaterial?r(f,p):p.isLineBasicMaterial?(a(f,p),p.isLineDashedMaterial&&o(f,p)):p.isPointsMaterial?l(f,p,y,_):p.isSpriteMaterial?c(f,p):p.isShadowMaterial?(f.color.value.copy(p.color),f.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(f,p){f.opacity.value=p.opacity,p.color&&f.diffuse.value.copy(p.color),p.emissive&&f.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.bumpMap&&(f.bumpMap.value=p.bumpMap,t(p.bumpMap,f.bumpMapTransform),f.bumpScale.value=p.bumpScale,p.side===It&&(f.bumpScale.value*=-1)),p.normalMap&&(f.normalMap.value=p.normalMap,t(p.normalMap,f.normalMapTransform),f.normalScale.value.copy(p.normalScale),p.side===It&&f.normalScale.value.negate()),p.displacementMap&&(f.displacementMap.value=p.displacementMap,t(p.displacementMap,f.displacementMapTransform),f.displacementScale.value=p.displacementScale,f.displacementBias.value=p.displacementBias),p.emissiveMap&&(f.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,f.emissiveMapTransform)),p.specularMap&&(f.specularMap.value=p.specularMap,t(p.specularMap,f.specularMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest);let y=e.get(p).envMap;if(y&&(f.envMap.value=y,f.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=p.reflectivity,f.ior.value=p.ior,f.refractionRatio.value=p.refractionRatio),p.lightMap){f.lightMap.value=p.lightMap;let _=i._useLegacyLights===!0?Math.PI:1;f.lightMapIntensity.value=p.lightMapIntensity*_,t(p.lightMap,f.lightMapTransform)}p.aoMap&&(f.aoMap.value=p.aoMap,f.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,f.aoMapTransform))}function a(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform))}function o(f,p){f.dashSize.value=p.dashSize,f.totalSize.value=p.dashSize+p.gapSize,f.scale.value=p.scale}function l(f,p,y,_){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.size.value=p.size*y,f.scale.value=_*.5,p.map&&(f.map.value=p.map,t(p.map,f.uvTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function c(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.rotation.value=p.rotation,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function h(f,p){f.specular.value.copy(p.specular),f.shininess.value=Math.max(p.shininess,1e-4)}function u(f,p){p.gradientMap&&(f.gradientMap.value=p.gradientMap)}function d(f,p){f.metalness.value=p.metalness,p.metalnessMap&&(f.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,f.metalnessMapTransform)),f.roughness.value=p.roughness,p.roughnessMap&&(f.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,f.roughnessMapTransform)),e.get(p).envMap&&(f.envMapIntensity.value=p.envMapIntensity)}function m(f,p,y){f.ior.value=p.ior,p.sheen>0&&(f.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),f.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(f.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,f.sheenColorMapTransform)),p.sheenRoughnessMap&&(f.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,f.sheenRoughnessMapTransform))),p.clearcoat>0&&(f.clearcoat.value=p.clearcoat,f.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(f.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,f.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(f.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===It&&f.clearcoatNormalScale.value.negate())),p.iridescence>0&&(f.iridescence.value=p.iridescence,f.iridescenceIOR.value=p.iridescenceIOR,f.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(f.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,f.iridescenceMapTransform)),p.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),p.transmission>0&&(f.transmission.value=p.transmission,f.transmissionSamplerMap.value=y.texture,f.transmissionSamplerSize.value.set(y.width,y.height),p.transmissionMap&&(f.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,f.transmissionMapTransform)),f.thickness.value=p.thickness,p.thicknessMap&&(f.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=p.attenuationDistance,f.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(f.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(f.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=p.specularIntensity,f.specularColor.value.copy(p.specularColor),p.specularColorMap&&(f.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,f.specularColorMapTransform)),p.specularIntensityMap&&(f.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,p){p.matcap&&(f.matcap.value=p.matcap)}function x(f,p){let y=e.get(p).light;f.referencePosition.value.setFromMatrixPosition(y.matrixWorld),f.nearDistance.value=y.shadow.camera.near,f.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function o0(i,e,t,n){let s={},r={},a=[],o=t.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(y,_){let b=_.program;n.uniformBlockBinding(y,b)}function c(y,_){let b=s[y.id];b===void 0&&(g(y),b=h(y),s[y.id]=b,y.addEventListener("dispose",f));let S=_.program;n.updateUBOMapping(y,S);let R=e.render.frame;r[y.id]!==R&&(d(y),r[y.id]=R)}function h(y){let _=u();y.__bindingPointIndex=_;let b=i.createBuffer(),S=y.__size,R=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,S,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,_,b),b}function u(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){let _=s[y.id],b=y.uniforms,S=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,_);for(let R=0,w=b.length;R<w;R++){let N=Array.isArray(b[R])?b[R]:[b[R]];for(let M=0,T=N.length;M<T;M++){let F=N[M];if(m(F,R,M,S)===!0){let X=F.__offset,j=Array.isArray(F.value)?F.value:[F.value],I=0;for(let U=0;U<j.length;U++){let G=j[U],Y=x(G);typeof G=="number"||typeof G=="boolean"?(F.__data[0]=G,i.bufferSubData(i.UNIFORM_BUFFER,X+I,F.__data)):G.isMatrix3?(F.__data[0]=G.elements[0],F.__data[1]=G.elements[1],F.__data[2]=G.elements[2],F.__data[3]=0,F.__data[4]=G.elements[3],F.__data[5]=G.elements[4],F.__data[6]=G.elements[5],F.__data[7]=0,F.__data[8]=G.elements[6],F.__data[9]=G.elements[7],F.__data[10]=G.elements[8],F.__data[11]=0):(G.toArray(F.__data,I),I+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,X,F.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(y,_,b,S){let R=y.value,w=_+"_"+b;if(S[w]===void 0)return typeof R=="number"||typeof R=="boolean"?S[w]=R:S[w]=R.clone(),!0;{let N=S[w];if(typeof R=="number"||typeof R=="boolean"){if(N!==R)return S[w]=R,!0}else if(N.equals(R)===!1)return N.copy(R),!0}return!1}function g(y){let _=y.uniforms,b=0,S=16;for(let w=0,N=_.length;w<N;w++){let M=Array.isArray(_[w])?_[w]:[_[w]];for(let T=0,F=M.length;T<F;T++){let X=M[T],j=Array.isArray(X.value)?X.value:[X.value];for(let I=0,U=j.length;I<U;I++){let G=j[I],Y=x(G),q=b%S;q!==0&&S-q<Y.boundary&&(b+=S-q),X.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),X.__offset=b,b+=Y.storage}}}let R=b%S;return R>0&&(b+=S-R),y.__size=b,y.__cache={},this}function x(y){let _={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(_.boundary=4,_.storage=4):y.isVector2?(_.boundary=8,_.storage=8):y.isVector3||y.isColor?(_.boundary=16,_.storage=12):y.isVector4?(_.boundary=16,_.storage=16):y.isMatrix3?(_.boundary=48,_.storage=48):y.isMatrix4?(_.boundary=64,_.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),_}function f(y){let _=y.target;_.removeEventListener("dispose",f);let b=a.indexOf(_.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(s[_.id]),delete s[_.id],delete r[_.id]}function p(){for(let y in s)i.deleteBuffer(s[y]);a=[],s={},r={}}return{bind:l,update:c,dispose:p}}function Gs(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function l0(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function hc(i,e){return i.distance-e.distance}function ua(i,e,t,n){if(i.layers.test(e.layers)&&i.raycast(e,t),n===!0){let s=i.children;for(let r=0,a=s.length;r<a;r++)ua(s[r],e,t,!0)}}var sn,cn,eu,Wa,tu,uc,nu,yn,Fn,It,Jt,Dn,Ri,Xa,Ya,qa,iu,Zn,su,ru,$a,Za,ou,au,lu,cu,Po,Io,hu,uu,du,fu,pu,mu,gu,xu,_u,yu,vu,Mu,Ws,bu,Su,Eu,wu,dc,Tu,Au,Nn,Ru,Cu,Pu,Iu,Lu,Du,fc,Ii,Li,Lo,Do,yr,No,jt,Uo,ot,Ka,no,At,Nu,ei,Un,Uu,Fu,da,pc,In,Ln,is,mc,gc,Jn,Ou,Ot,Bu,zu,jn,Di,Hu,xc,ku,_c,yc,Ji,io,so,ro,Xs,Ja,ja,Qa,vr,el,tl,Ys,nl,il,sl,qs,rl,$s,ol,al,ll,cl,hl,ul,dl,ji,fl,pl,Vu,ml,gl,xl,Zs,Ks,oo,_l,yl,vl,vc,Qn,Gu,Wu,Xu,Yu,Gt,at,en,fa,Mr,Js,Je,js,Qs,ai,Ml,qu,$u,Zu,Mc,Ku,Ju,ju,Qu,bl,bc,Sl,Fo,vn,er,an,yt,El,Qi,ss,br,Te,ke,ao,wl,Tl,Al,vs,md,$e,li,ir,gd,sr,xd,zt,gt,Bo,Mn,rr,zo,Ht,L,ho,Rl,Xt,pn,$t,Ms,ci,hi,ui,Tn,An,Wn,Xi,bs,Ss,Xn,_d,Yi,fo,ti,mn,po,Es,Rn,mo,ws,go,Ni,tt,di,Zt,yd,vd,Cn,Ts,Nt,Cl,Pl,or,rs,Md,Il,fi,gn,As,qi,bd,Sd,Ll,Dl,Nl,Ed,wd,tn,Kt,xn,xo,_n,pi,mi,Ul,_o,yo,vo,Rs,wi,Ec,Pn,Cs,Xe,vt,Td,Ui,ni,rt,Ps,Bt,ar,lr,bt,Ad,Vt,bo,gi,Ut,$i,pt,ln,Fl,Yn,Is,Ol,xi,_i,yi,So,Ls,Ds,Ns,Us,Bl,zl,Hl,Fs,Os,Wt,os,Pd,Id,Ld,bn,cr,Rt,vi,Mi,Ho,hr,ko,Eo,Dd,Nd,Ft,qn,zs,Oi,Vo,Fd,Od,Bd,zd,Hd,kd,Vd,Gd,Wd,Xd,Yd,qd,$d,Zd,Kd,Jd,jd,Qd,ef,tf,nf,sf,rf,of,af,lf,cf,hf,uf,df,ff,pf,mf,gf,xf,_f,yf,vf,Mf,bf,Sf,Ef,wf,Tf,Af,Rf,Cf,Pf,If,Lf,Df,Nf,Uf,Ff,Of,Bf,zf,Hf,kf,Vf,Gf,Wf,Xf,Yf,qf,$f,Zf,Kf,Jf,jf,Qf,ep,tp,np,ip,sp,rp,op,ap,lp,cp,hp,up,dp,fp,pp,mp,gp,xp,_p,yp,vp,Mp,bp,Sp,Ep,wp,Tp,Ap,Rp,Cp,Pp,Ip,Lp,Dp,Np,Up,Fp,Op,Bp,zp,Hp,kp,Vp,Gp,Wp,Xp,Yp,qp,$p,Zp,Kp,Jp,jp,Qp,em,tm,nm,im,sm,rm,om,am,lm,cm,hm,um,dm,fm,pm,mm,Fe,le,on,Hs,Go,Ti,kl,Kn,wo,Vl,To,Ao,Ro,$n,bi,Gl,ur,dr,Ac,Rc,Cc,Pc,Ic,ql,$l,Zl,Kl,Jl,Wo,Xo,Yo,Co,Pi,vg,Mg,Pg,Ig,Dg,kg,$o,Zo,$g,Ko,Jo,jg,Qg,jo,Qt,s0,ns,Qo,as,ea,fr,pr,mr,mt,Si,lc,Vs,cc,a0,Zi,Ki,ii,gr,xr,Bi,ta,na,ia,nn,si,sa,ra,oa,ls,ri,aa,la,c0,ca,ga,h0,xa,u0,d0,f0,p0,m0,g0,x0,ha,Qe,gx,_r,oi,Er=st(()=>{sn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},cn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},eu=0,Wa=1,tu=2,uc=1,nu=2,yn=3,Fn=0,It=1,Jt=2,Dn=0,Ri=1,Xa=2,Ya=3,qa=4,iu=5,Zn=100,su=101,ru=102,$a=103,Za=104,ou=200,au=201,lu=202,cu=203,Po=204,Io=205,hu=206,uu=207,du=208,fu=209,pu=210,mu=211,gu=212,xu=213,_u=214,yu=0,vu=1,Mu=2,Ws=3,bu=4,Su=5,Eu=6,wu=7,dc=0,Tu=1,Au=2,Nn=0,Ru=1,Cu=2,Pu=3,Iu=4,Lu=5,Du=6,fc=300,Ii=301,Li=302,Lo=303,Do=304,yr=306,No=1e3,jt=1001,Uo=1002,ot=1003,Ka=1004,no=1005,At=1006,Nu=1007,ei=1008,Un=1009,Uu=1010,Fu=1011,da=1012,pc=1013,In=1014,Ln=1015,is=1016,mc=1017,gc=1018,Jn=1020,Ou=1021,Ot=1023,Bu=1024,zu=1025,jn=1026,Di=1027,Hu=1028,xc=1029,ku=1030,_c=1031,yc=1033,Ji=33776,io=33777,so=33778,ro=33779,Xs=35840,Ja=35841,ja=35842,Qa=35843,vr=36196,el=37492,tl=37496,Ys=37808,nl=37809,il=37810,sl=37811,qs=37812,rl=37813,$s=37814,ol=37815,al=37816,ll=37817,cl=37818,hl=37819,ul=37820,dl=37821,ji=36492,fl=36494,pl=36495,Vu=36283,ml=36284,gl=36285,xl=36286,Zs=2300,Ks=2301,oo=2302,_l=2400,yl=2401,vl=2402,vc=3e3,Qn=3001,Gu=3200,Wu=3201,Xu=0,Yu=1,Gt="",at="srgb",en="srgb-linear",fa="display-p3",Mr="display-p3-linear",Js="linear",Je="srgb",js="rec709",Qs="p3",ai=7680,Ml=519,qu=512,$u=513,Zu=514,Mc=515,Ku=516,Ju=517,ju=518,Qu=519,bl=35044,bc=35048,Sl="300 es",Fo=1035,vn=2e3,er=2001,an=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},yt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],El=1234567,Qi=Math.PI/180,ss=180/Math.PI;br={DEG2RAD:Qi,RAD2DEG:ss,generateUUID:zi,clamp:Mt,euclideanModulo:pa,mapLinear:ed,inverseLerp:td,lerp:es,damp:nd,pingpong:id,smoothstep:sd,smootherstep:rd,randInt:od,randFloat:ad,randFloatSpread:ld,seededRandom:cd,degToRad:hd,radToDeg:ud,isPowerOfTwo:Oo,ceilPowerOfTwo:dd,floorPowerOfTwo:tr,setQuaternionFromProperEuler:fd,normalize:wt,denormalize:Ei},Te=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},ke=class i{constructor(e,t,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],m=n[5],g=n[8],x=s[0],f=s[3],p=s[6],y=s[1],_=s[4],b=s[7],S=s[2],R=s[5],w=s[8];return r[0]=a*x+o*y+l*S,r[3]=a*f+o*_+l*R,r[6]=a*p+o*b+l*w,r[1]=c*x+h*y+u*S,r[4]=c*f+h*_+u*R,r[7]=c*p+h*b+u*w,r[2]=d*x+m*y+g*S,r[5]=d*f+m*_+g*R,r[8]=d*p+m*b+g*w,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,m=c*r-a*l,g=t*u+n*d+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=u*x,e[1]=(s*c-h*n)*x,e[2]=(o*n-s*a)*x,e[3]=d*x,e[4]=(h*t-s*l)*x,e[5]=(s*r-o*t)*x,e[6]=m*x,e[7]=(n*l-c*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ao.makeScale(e,t)),this}rotate(e){return this.premultiply(ao.makeRotation(-e)),this}translate(e,t){return this.premultiply(ao.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ao=new ke;wl={};Tl=new ke().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Al=new ke().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),vs={[en]:{transfer:Js,primaries:js,toReference:i=>i,fromReference:i=>i},[at]:{transfer:Je,primaries:js,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[Mr]:{transfer:Js,primaries:Qs,toReference:i=>i.applyMatrix3(Al),fromReference:i=>i.applyMatrix3(Tl)},[fa]:{transfer:Je,primaries:Qs,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Al),fromReference:i=>i.applyMatrix3(Tl).convertLinearToSRGB()}},md=new Set([en,Mr]),$e={enabled:!0,_workingColorSpace:en,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!md.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,e,t){if(this.enabled===!1||e===t||!e||!t)return i;let n=vs[e].toReference,s=vs[t].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,e){return this.convert(i,this._workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this._workingColorSpace)},getPrimaries:function(i){return vs[i].primaries},getTransfer:function(i){return i===Gt?Js:vs[i].transfer}};ir=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{li===void 0&&(li=nr("canvas")),li.width=e.width,li.height=e.height;let n=li.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=li}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=nr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Ci(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Ci(t[n]/255)*255):t[n]=Ci(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},gd=0,sr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:gd++}),this.uuid=zi(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(co(s[a].image)):r.push(co(s[a]))}else r=co(s);n.url=r}return t||(e.images[this.uuid]=n),n}};xd=0,zt=class i extends an{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=jt,s=jt,r=At,a=ei,o=Ot,l=Un,c=i.DEFAULT_ANISOTROPY,h=Gt){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:xd++}),this.uuid=zi(),this.name="",this.source=new sr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Te(0,0),this.repeat=new Te(1,1),this.center=new Te(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(ts("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===Qn?at:Gt),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==fc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case No:e.x=e.x-Math.floor(e.x);break;case jt:e.x=e.x<0?0:1;break;case Uo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case No:e.y=e.y-Math.floor(e.y);break;case jt:e.y=e.y<0?0:1;break;case Uo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return ts("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===at?Qn:vc}set encoding(e){ts("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===Qn?at:Gt}};zt.DEFAULT_IMAGE=null;zt.DEFAULT_MAPPING=fc;zt.DEFAULT_ANISOTROPY=1;gt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],m=l[5],g=l[9],x=l[2],f=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-f)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+f)<.1&&Math.abs(c+m+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let _=(c+1)/2,b=(m+1)/2,S=(p+1)/2,R=(h+d)/4,w=(u+x)/4,N=(g+f)/4;return _>b&&_>S?_<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(_),s=R/n,r=w/n):b>S?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=R/s,r=N/s):S<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(S),n=w/r,s=N/r),this.set(n,s,r,t),this}let y=Math.sqrt((f-g)*(f-g)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(y)<.001&&(y=1),this.x=(f-g)/y,this.y=(u-x)/y,this.z=(d-h)/y,this.w=Math.acos((c+m+p-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Bo=class extends an{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t);let s={width:e,height:t,depth:1};n.encoding!==void 0&&(ts("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===Qn?at:Gt),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:At,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new zt(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new sr(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Mn=class extends Bo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},rr=class extends zt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ot,this.minFilter=ot,this.wrapR=jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},zo=class extends zt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ot,this.minFilter=ot,this.wrapR=jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ht=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],d=r[a+0],m=r[a+1],g=r[a+2],x=r[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=x;return}if(u!==x||l!==d||c!==m||h!==g){let f=1-o,p=l*d+c*m+h*g+u*x,y=p>=0?1:-1,_=1-p*p;if(_>Number.EPSILON){let S=Math.sqrt(_),R=Math.atan2(S,p*y);f=Math.sin(f*R)/S,o=Math.sin(o*R)/S}let b=o*y;if(l=l*f+d*b,c=c*f+m*b,h=h*f+g*b,u=u*f+x*b,f===1-o){let S=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=S,c*=S,h*=S,u*=S}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[a],d=r[a+1],m=r[a+2],g=r[a+3];return e[t]=o*g+h*u+l*m-c*d,e[t+1]=l*g+h*d+c*u-o*m,e[t+2]=c*g+h*m+o*d-l*u,e[t+3]=h*g-o*u-l*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(r/2),d=l(n/2),m=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*m*g,this._y=c*m*u-d*h*g,this._z=c*h*g+d*m*u,this._w=c*h*u-d*m*g;break;case"YXZ":this._x=d*h*u+c*m*g,this._y=c*m*u-d*h*g,this._z=c*h*g-d*m*u,this._w=c*h*u+d*m*g;break;case"ZXY":this._x=d*h*u-c*m*g,this._y=c*m*u+d*h*g,this._z=c*h*g+d*m*u,this._w=c*h*u-d*m*g;break;case"ZYX":this._x=d*h*u-c*m*g,this._y=c*m*u+d*h*g,this._z=c*h*g-d*m*u,this._w=c*h*u+d*m*g;break;case"YZX":this._x=d*h*u+c*m*g,this._y=c*m*u+d*h*g,this._z=c*h*g-d*m*u,this._w=c*h*u-d*m*g;break;case"XZY":this._x=d*h*u-c*m*g,this._y=c*m*u-d*h*g,this._z=c*h*g+d*m*u,this._w=c*h*u+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(h-l)*m,this._y=(r-c)*m,this._z=(a-s)*m}else if(n>o&&n>u){let m=2*Math.sqrt(1+n-o-u);this._w=(h-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+c)/m}else if(o>u){let m=2*Math.sqrt(1+o-n-u);this._w=(r-c)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+h)/m}else{let m=2*Math.sqrt(1+u-n-o);this._w=(a-s)/m,this._x=(r+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Mt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),s=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(s),n*Math.sin(r),n*Math.cos(r),t*Math.sin(s))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Rl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Rl.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ho.copy(this).projectOnVector(e),this.sub(ho)}reflect(e){return this.sub(ho.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ho=new L,Rl=new Ht,Xt=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint($t.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint($t.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=$t.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,$t):$t.fromBufferAttribute(r,a),$t.applyMatrix4(e.matrixWorld),this.expandByPoint($t);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ms.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ms.copy(n.boundingBox)),Ms.applyMatrix4(e.matrixWorld),this.union(Ms)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,$t),$t.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Xi),bs.subVectors(this.max,Xi),ci.subVectors(e.a,Xi),hi.subVectors(e.b,Xi),ui.subVectors(e.c,Xi),Tn.subVectors(hi,ci),An.subVectors(ui,hi),Wn.subVectors(ci,ui);let t=[0,-Tn.z,Tn.y,0,-An.z,An.y,0,-Wn.z,Wn.y,Tn.z,0,-Tn.x,An.z,0,-An.x,Wn.z,0,-Wn.x,-Tn.y,Tn.x,0,-An.y,An.x,0,-Wn.y,Wn.x,0];return!uo(t,ci,hi,ui,bs)||(t=[1,0,0,0,1,0,0,0,1],!uo(t,ci,hi,ui,bs))?!1:(Ss.crossVectors(Tn,An),t=[Ss.x,Ss.y,Ss.z],uo(t,ci,hi,ui,bs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,$t).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize($t).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(pn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},pn=[new L,new L,new L,new L,new L,new L,new L,new L],$t=new L,Ms=new Xt,ci=new L,hi=new L,ui=new L,Tn=new L,An=new L,Wn=new L,Xi=new L,bs=new L,Ss=new L,Xn=new L;_d=new Xt,Yi=new L,fo=new L,ti=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):_d.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Yi.subVectors(e,this.center);let t=Yi.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Yi,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(fo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Yi.copy(e.center).add(fo)),this.expandByPoint(Yi.copy(e.center).sub(fo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},mn=new L,po=new L,Es=new L,Rn=new L,mo=new L,ws=new L,go=new L,Ni=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,mn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=mn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(mn.copy(this.origin).addScaledVector(this.direction,t),mn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){po.copy(e).add(t).multiplyScalar(.5),Es.copy(t).sub(e).normalize(),Rn.copy(this.origin).sub(po);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Es),o=Rn.dot(this.direction),l=-Rn.dot(Es),c=Rn.lengthSq(),h=Math.abs(1-a*a),u,d,m,g;if(h>0)if(u=a*l-o,d=a*o-l,g=r*h,u>=0)if(d>=-g)if(d<=g){let x=1/h;u*=x,d*=x,m=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),m=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(po).addScaledVector(Es,d),m}intersectSphere(e,t){mn.subVectors(e.center,this.origin);let n=mn.dot(this.direction),s=mn.dot(mn)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,s=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,s=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,mn)!==null}intersectTriangle(e,t,n,s,r){mo.subVectors(t,e),ws.subVectors(n,e),go.crossVectors(mo,ws);let a=this.direction.dot(go),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Rn.subVectors(this.origin,e);let l=o*this.direction.dot(ws.crossVectors(Rn,ws));if(l<0)return null;let c=o*this.direction.dot(mo.cross(Rn));if(c<0||l+c>a)return null;let h=-o*Rn.dot(go);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},tt=class i{constructor(e,t,n,s,r,a,o,l,c,h,u,d,m,g,x,f){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,u,d,m,g,x,f)}set(e,t,n,s,r,a,o,l,c,h,u,d,m,g,x,f){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=m,p[7]=g,p[11]=x,p[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/di.setFromMatrixColumn(e,0).length(),r=1/di.setFromMatrixColumn(e,1).length(),a=1/di.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,m=a*u,g=o*h,x=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=m+g*c,t[5]=d-x*c,t[9]=-o*l,t[2]=x-d*c,t[6]=g+m*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,m=l*u,g=c*h,x=c*u;t[0]=d+x*o,t[4]=g*o-m,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=m*o-g,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,m=l*u,g=c*h,x=c*u;t[0]=d-x*o,t[4]=-a*u,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*h,t[9]=x-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,m=a*u,g=o*h,x=o*u;t[0]=l*h,t[4]=g*c-m,t[8]=d*c+x,t[1]=l*u,t[5]=x*c+d,t[9]=m*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,m=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=x-d*u,t[8]=g*u+m,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=m*u+g,t[10]=d-x*u}else if(e.order==="XZY"){let d=a*l,m=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+x,t[5]=a*h,t[9]=m*u-g,t[2]=g*u-m,t[6]=o*h,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(yd,e,vd)}lookAt(e,t,n){let s=this.elements;return Nt.subVectors(e,t),Nt.lengthSq()===0&&(Nt.z=1),Nt.normalize(),Cn.crossVectors(n,Nt),Cn.lengthSq()===0&&(Math.abs(n.z)===1?Nt.x+=1e-4:Nt.z+=1e-4,Nt.normalize(),Cn.crossVectors(n,Nt)),Cn.normalize(),Ts.crossVectors(Nt,Cn),s[0]=Cn.x,s[4]=Ts.x,s[8]=Nt.x,s[1]=Cn.y,s[5]=Ts.y,s[9]=Nt.y,s[2]=Cn.z,s[6]=Ts.z,s[10]=Nt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],m=n[13],g=n[2],x=n[6],f=n[10],p=n[14],y=n[3],_=n[7],b=n[11],S=n[15],R=s[0],w=s[4],N=s[8],M=s[12],T=s[1],F=s[5],X=s[9],j=s[13],I=s[2],U=s[6],G=s[10],Y=s[14],q=s[3],W=s[7],Q=s[11],ne=s[15];return r[0]=a*R+o*T+l*I+c*q,r[4]=a*w+o*F+l*U+c*W,r[8]=a*N+o*X+l*G+c*Q,r[12]=a*M+o*j+l*Y+c*ne,r[1]=h*R+u*T+d*I+m*q,r[5]=h*w+u*F+d*U+m*W,r[9]=h*N+u*X+d*G+m*Q,r[13]=h*M+u*j+d*Y+m*ne,r[2]=g*R+x*T+f*I+p*q,r[6]=g*w+x*F+f*U+p*W,r[10]=g*N+x*X+f*G+p*Q,r[14]=g*M+x*j+f*Y+p*ne,r[3]=y*R+_*T+b*I+S*q,r[7]=y*w+_*F+b*U+S*W,r[11]=y*N+_*X+b*G+S*Q,r[15]=y*M+_*j+b*Y+S*ne,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],m=e[14],g=e[3],x=e[7],f=e[11],p=e[15];return g*(+r*l*u-s*c*u-r*o*d+n*c*d+s*o*m-n*l*m)+x*(+t*l*m-t*c*d+r*a*d-s*a*m+s*c*h-r*l*h)+f*(+t*c*u-t*o*m-r*a*u+n*a*m+r*o*h-n*c*h)+p*(-s*o*h-t*l*u+t*o*d+s*a*u-n*a*d+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],m=e[11],g=e[12],x=e[13],f=e[14],p=e[15],y=u*f*c-x*d*c+x*l*m-o*f*m-u*l*p+o*d*p,_=g*d*c-h*f*c-g*l*m+a*f*m+h*l*p-a*d*p,b=h*x*c-g*u*c+g*o*m-a*x*m-h*o*p+a*u*p,S=g*u*l-h*x*l-g*o*d+a*x*d+h*o*f-a*u*f,R=t*y+n*_+s*b+r*S;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let w=1/R;return e[0]=y*w,e[1]=(x*d*r-u*f*r-x*s*m+n*f*m+u*s*p-n*d*p)*w,e[2]=(o*f*r-x*l*r+x*s*c-n*f*c-o*s*p+n*l*p)*w,e[3]=(u*l*r-o*d*r-u*s*c+n*d*c+o*s*m-n*l*m)*w,e[4]=_*w,e[5]=(h*f*r-g*d*r+g*s*m-t*f*m-h*s*p+t*d*p)*w,e[6]=(g*l*r-a*f*r-g*s*c+t*f*c+a*s*p-t*l*p)*w,e[7]=(a*d*r-h*l*r+h*s*c-t*d*c-a*s*m+t*l*m)*w,e[8]=b*w,e[9]=(g*u*r-h*x*r-g*n*m+t*x*m+h*n*p-t*u*p)*w,e[10]=(a*x*r-g*o*r+g*n*c-t*x*c-a*n*p+t*o*p)*w,e[11]=(h*o*r-a*u*r-h*n*c+t*u*c+a*n*m-t*o*m)*w,e[12]=S*w,e[13]=(h*x*s-g*u*s+g*n*d-t*x*d-h*n*f+t*u*f)*w,e[14]=(g*o*s-a*x*s-g*n*l+t*x*l+a*n*f-t*o*f)*w,e[15]=(a*u*s-h*o*s+h*n*l-t*u*l-a*n*d+t*o*d)*w,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,m=r*h,g=r*u,x=a*h,f=a*u,p=o*u,y=l*c,_=l*h,b=l*u,S=n.x,R=n.y,w=n.z;return s[0]=(1-(x+p))*S,s[1]=(m+b)*S,s[2]=(g-_)*S,s[3]=0,s[4]=(m-b)*R,s[5]=(1-(d+p))*R,s[6]=(f+y)*R,s[7]=0,s[8]=(g+_)*w,s[9]=(f-y)*w,s[10]=(1-(d+x))*w,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=di.set(s[0],s[1],s[2]).length(),a=di.set(s[4],s[5],s[6]).length(),o=di.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Zt.copy(this);let c=1/r,h=1/a,u=1/o;return Zt.elements[0]*=c,Zt.elements[1]*=c,Zt.elements[2]*=c,Zt.elements[4]*=h,Zt.elements[5]*=h,Zt.elements[6]*=h,Zt.elements[8]*=u,Zt.elements[9]*=u,Zt.elements[10]*=u,t.setFromRotationMatrix(Zt),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=vn){let l=this.elements,c=2*r/(t-e),h=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),m,g;if(o===vn)m=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===er)m=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=vn){let l=this.elements,c=1/(t-e),h=1/(n-s),u=1/(a-r),d=(t+e)*c,m=(n+s)*h,g,x;if(o===vn)g=(a+r)*u,x=-2*u;else if(o===er)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},di=new L,Zt=new tt,yd=new L(0,0,0),vd=new L(1,1,1),Cn=new L,Ts=new L,Nt=new L,Cl=new tt,Pl=new Ht,or=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(Mt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Mt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Mt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Mt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Mt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Mt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Cl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Cl,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Pl.setFromEuler(this),this.setFromQuaternion(Pl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};or.DEFAULT_ORDER="XYZ";rs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Md=0,Il=new L,fi=new Ht,gn=new tt,As=new L,qi=new L,bd=new L,Sd=new Ht,Ll=new L(1,0,0),Dl=new L(0,1,0),Nl=new L(0,0,1),Ed={type:"added"},wd={type:"removed"},tn=class i extends an{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Md++}),this.uuid=zi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new L,t=new or,n=new Ht,s=new L(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new tt},normalMatrix:{value:new ke}}),this.matrix=new tt,this.matrixWorld=new tt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new rs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return fi.setFromAxisAngle(e,t),this.quaternion.multiply(fi),this}rotateOnWorldAxis(e,t){return fi.setFromAxisAngle(e,t),this.quaternion.premultiply(fi),this}rotateX(e){return this.rotateOnAxis(Ll,e)}rotateY(e){return this.rotateOnAxis(Dl,e)}rotateZ(e){return this.rotateOnAxis(Nl,e)}translateOnAxis(e,t){return Il.copy(e).applyQuaternion(this.quaternion),this.position.add(Il.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ll,e)}translateY(e){return this.translateOnAxis(Dl,e)}translateZ(e){return this.translateOnAxis(Nl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(gn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?As.copy(e):As.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),qi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?gn.lookAt(qi,As,this.up):gn.lookAt(As,qi,this.up),this.quaternion.setFromRotationMatrix(gn),s&&(gn.extractRotation(s.matrixWorld),fi.setFromRotationMatrix(gn),this.quaternion.premultiply(fi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Ed)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(wd)),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),gn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),gn.multiply(e.parent.matrixWorld)),e.applyMatrix4(gn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(qi,e,bd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(qi,Sd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++){let r=t[n];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++){let o=s[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};tn.DEFAULT_UP=new L(0,1,0);tn.DEFAULT_MATRIX_AUTO_UPDATE=!0;tn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;Kt=new L,xn=new L,xo=new L,_n=new L,pi=new L,mi=new L,Ul=new L,_o=new L,yo=new L,vo=new L,Rs=!1,wi=class i{constructor(e=new L,t=new L,n=new L){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Kt.subVectors(e,t),s.cross(Kt);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Kt.subVectors(s,t),xn.subVectors(n,t),xo.subVectors(e,t);let a=Kt.dot(Kt),o=Kt.dot(xn),l=Kt.dot(xo),c=xn.dot(xn),h=xn.dot(xo),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,m=(c*l-o*h)*d,g=(a*h-o*l)*d;return r.set(1-m-g,g,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,_n)===null?!1:_n.x>=0&&_n.y>=0&&_n.x+_n.y<=1}static getUV(e,t,n,s,r,a,o,l){return Rs===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Rs=!0),this.getInterpolation(e,t,n,s,r,a,o,l)}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,_n)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,_n.x),l.addScaledVector(a,_n.y),l.addScaledVector(o,_n.z),l)}static isFrontFacing(e,t,n,s){return Kt.subVectors(n,t),xn.subVectors(e,t),Kt.cross(xn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Kt.subVectors(this.c,this.b),xn.subVectors(this.a,this.b),Kt.cross(xn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,s,r){return Rs===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Rs=!0),i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;pi.subVectors(s,n),mi.subVectors(r,n),_o.subVectors(e,n);let l=pi.dot(_o),c=mi.dot(_o);if(l<=0&&c<=0)return t.copy(n);yo.subVectors(e,s);let h=pi.dot(yo),u=mi.dot(yo);if(h>=0&&u<=h)return t.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(pi,a);vo.subVectors(e,r);let m=pi.dot(vo),g=mi.dot(vo);if(g>=0&&m<=g)return t.copy(r);let x=m*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(mi,o);let f=h*g-m*u;if(f<=0&&u-h>=0&&m-g>=0)return Ul.subVectors(r,s),o=(u-h)/(u-h+(m-g)),t.copy(s).addScaledVector(Ul,o);let p=1/(f+x+d);return a=x*p,o=d*p,t.copy(n).addScaledVector(pi,a).addScaledVector(mi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Ec={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pn={h:0,s:0,l:0},Cs={h:0,s:0,l:0};Xe=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=at){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=$e.workingColorSpace){return this.r=e,this.g=t,this.b=n,$e.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=$e.workingColorSpace){if(e=pa(e,1),t=Mt(t,0,1),n=Mt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Mo(a,r,e+1/3),this.g=Mo(a,r,e),this.b=Mo(a,r,e-1/3)}return $e.toWorkingColorSpace(this,s),this}setStyle(e,t=at){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=at){let n=Ec[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ci(e.r),this.g=Ci(e.g),this.b=Ci(e.b),this}copyLinearToSRGB(e){return this.r=lo(e.r),this.g=lo(e.g),this.b=lo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=at){return $e.fromWorkingColorSpace(vt.copy(this),e),Math.round(Mt(vt.r*255,0,255))*65536+Math.round(Mt(vt.g*255,0,255))*256+Math.round(Mt(vt.b*255,0,255))}getHexString(e=at){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.fromWorkingColorSpace(vt.copy(this),t);let n=vt.r,s=vt.g,r=vt.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=$e.workingColorSpace){return $e.fromWorkingColorSpace(vt.copy(this),t),e.r=vt.r,e.g=vt.g,e.b=vt.b,e}getStyle(e=at){$e.fromWorkingColorSpace(vt.copy(this),e);let t=vt.r,n=vt.g,s=vt.b;return e!==at?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Pn),this.setHSL(Pn.h+e,Pn.s+t,Pn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Pn),e.getHSL(Cs);let n=es(Pn.h,Cs.h,t),s=es(Pn.s,Cs.s,t),r=es(Pn.l,Cs.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},vt=new Xe;Xe.NAMES=Ec;Td=0,Ui=class extends an{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Td++}),this.uuid=zi(),this.name="",this.type="Material",this.blending=Ri,this.side=Fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Po,this.blendDst=Io,this.blendEquation=Zn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Xe(0,0,0),this.blendAlpha=0,this.depthFunc=Ws,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ml,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ai,this.stencilZFail=ai,this.stencilZPass=ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ri&&(n.blending=this.blending),this.side!==Fn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Po&&(n.blendSrc=this.blendSrc),this.blendDst!==Io&&(n.blendDst=this.blendDst),this.blendEquation!==Zn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ws&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ml&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ai&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ai&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ai&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},ni=class extends Ui{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=dc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},rt=new L,Ps=new Te,Bt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=bl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Ln,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ps.fromBufferAttribute(this,t),Ps.applyMatrix3(e),this.setXY(t,Ps.x,Ps.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.applyMatrix3(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.applyMatrix4(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.applyNormalMatrix(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.transformDirection(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ei(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=wt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ei(t,this.array)),t}setX(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ei(t,this.array)),t}setY(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ei(t,this.array)),t}setZ(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ei(t,this.array)),t}setW(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=wt(t,this.array),n=wt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=wt(t,this.array),n=wt(n,this.array),s=wt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=wt(t,this.array),n=wt(n,this.array),s=wt(s,this.array),r=wt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==bl&&(e.usage=this.usage),e}},ar=class extends Bt{constructor(e,t,n){super(new Uint16Array(e),t,n)}},lr=class extends Bt{constructor(e,t,n){super(new Uint32Array(e),t,n)}},bt=class extends Bt{constructor(e,t,n){super(new Float32Array(e),t,n)}},Ad=0,Vt=new tt,bo=new tn,gi=new L,Ut=new Xt,$i=new Xt,pt=new L,ln=class i extends an{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ad++}),this.uuid=zi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sc(e)?lr:ar)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ke().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Vt.makeRotationFromQuaternion(e),this.applyMatrix4(Vt),this}rotateX(e){return Vt.makeRotationX(e),this.applyMatrix4(Vt),this}rotateY(e){return Vt.makeRotationY(e),this.applyMatrix4(Vt),this}rotateZ(e){return Vt.makeRotationZ(e),this.applyMatrix4(Vt),this}translate(e,t,n){return Vt.makeTranslation(e,t,n),this.applyMatrix4(Vt),this}scale(e,t,n){return Vt.makeScale(e,t,n),this.applyMatrix4(Vt),this}lookAt(e){return bo.lookAt(e),bo.updateMatrix(),this.applyMatrix4(bo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gi).negate(),this.translate(gi.x,gi.y,gi.z),this}setFromPoints(e){let t=[];for(let n=0,s=e.length;n<s;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new bt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Xt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];Ut.setFromBufferAttribute(r),this.morphTargetsRelative?(pt.addVectors(this.boundingBox.min,Ut.min),this.boundingBox.expandByPoint(pt),pt.addVectors(this.boundingBox.max,Ut.max),this.boundingBox.expandByPoint(pt)):(this.boundingBox.expandByPoint(Ut.min),this.boundingBox.expandByPoint(Ut.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ti);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new L,1/0);return}if(e){let n=this.boundingSphere.center;if(Ut.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];$i.setFromBufferAttribute(o),this.morphTargetsRelative?(pt.addVectors(Ut.min,$i.min),Ut.expandByPoint(pt),pt.addVectors(Ut.max,$i.max),Ut.expandByPoint(pt)):(Ut.expandByPoint($i.min),Ut.expandByPoint($i.max))}Ut.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)pt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(pt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)pt.fromBufferAttribute(o,c),l&&(gi.fromBufferAttribute(e,c),pt.add(gi)),s=Math.max(s,n.distanceToSquared(pt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.array,s=t.position.array,r=t.normal.array,a=t.uv.array,o=s.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Bt(new Float32Array(4*o),4));let l=this.getAttribute("tangent").array,c=[],h=[];for(let T=0;T<o;T++)c[T]=new L,h[T]=new L;let u=new L,d=new L,m=new L,g=new Te,x=new Te,f=new Te,p=new L,y=new L;function _(T,F,X){u.fromArray(s,T*3),d.fromArray(s,F*3),m.fromArray(s,X*3),g.fromArray(a,T*2),x.fromArray(a,F*2),f.fromArray(a,X*2),d.sub(u),m.sub(u),x.sub(g),f.sub(g);let j=1/(x.x*f.y-f.x*x.y);isFinite(j)&&(p.copy(d).multiplyScalar(f.y).addScaledVector(m,-x.y).multiplyScalar(j),y.copy(m).multiplyScalar(x.x).addScaledVector(d,-f.x).multiplyScalar(j),c[T].add(p),c[F].add(p),c[X].add(p),h[T].add(y),h[F].add(y),h[X].add(y))}let b=this.groups;b.length===0&&(b=[{start:0,count:n.length}]);for(let T=0,F=b.length;T<F;++T){let X=b[T],j=X.start,I=X.count;for(let U=j,G=j+I;U<G;U+=3)_(n[U+0],n[U+1],n[U+2])}let S=new L,R=new L,w=new L,N=new L;function M(T){w.fromArray(r,T*3),N.copy(w);let F=c[T];S.copy(F),S.sub(w.multiplyScalar(w.dot(F))).normalize(),R.crossVectors(N,F);let j=R.dot(h[T])<0?-1:1;l[T*4]=S.x,l[T*4+1]=S.y,l[T*4+2]=S.z,l[T*4+3]=j}for(let T=0,F=b.length;T<F;++T){let X=b[T],j=X.start,I=X.count;for(let U=j,G=j+I;U<G;U+=3)M(n[U+0]),M(n[U+1]),M(n[U+2])}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Bt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);let s=new L,r=new L,a=new L,o=new L,l=new L,c=new L,h=new L,u=new L;if(e)for(let d=0,m=e.count;d<m;d+=3){let g=e.getX(d+0),x=e.getX(d+1),f=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,f),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,f),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)pt.fromBufferAttribute(e,t),pt.normalize(),e.setXYZ(t,pt.x,pt.y,pt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),m=0,g=0;for(let x=0,f=l.length;x<f;x++){o.isInterleavedBufferAttribute?m=l[x]*o.data.stride+o.offset:m=l[x]*h;for(let p=0;p<h;p++)d[g++]=c[m++]}return new Bt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=c[h],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let m=c[u];h.push(m.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,m=u.length;d<m;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Fl=new tt,Yn=new Ni,Is=new ti,Ol=new L,xi=new L,_i=new L,yi=new L,So=new L,Ls=new L,Ds=new Te,Ns=new Te,Us=new Te,Bl=new L,zl=new L,Hl=new L,Fs=new L,Os=new L,Wt=class extends tn{constructor(e=new ln,t=new ni){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Ls.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(So.fromBufferAttribute(u,e),a?Ls.addScaledVector(So,h):Ls.addScaledVector(So.sub(t),h))}t.add(Ls)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Is.copy(n.boundingSphere),Is.applyMatrix4(r),Yn.copy(e.ray).recast(e.near),!(Is.containsPoint(Yn.origin)===!1&&(Yn.intersectSphere(Is,Ol)===null||Yn.origin.distanceToSquared(Ol)>(e.far-e.near)**2))&&(Fl.copy(r).invert(),Yn.copy(e.ray).applyMatrix4(Fl),!(n.boundingBox!==null&&Yn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Yn)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let f=d[g],p=a[f.materialIndex],y=Math.max(f.start,m.start),_=Math.min(o.count,Math.min(f.start+f.count,m.start+m.count));for(let b=y,S=_;b<S;b+=3){let R=o.getX(b),w=o.getX(b+1),N=o.getX(b+2);s=Bs(this,p,e,n,c,h,u,R,w,N),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(o.count,m.start+m.count);for(let f=g,p=x;f<p;f+=3){let y=o.getX(f),_=o.getX(f+1),b=o.getX(f+2);s=Bs(this,a,e,n,c,h,u,y,_,b),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let f=d[g],p=a[f.materialIndex],y=Math.max(f.start,m.start),_=Math.min(l.count,Math.min(f.start+f.count,m.start+m.count));for(let b=y,S=_;b<S;b+=3){let R=b,w=b+1,N=b+2;s=Bs(this,p,e,n,c,h,u,R,w,N),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{let g=Math.max(0,m.start),x=Math.min(l.count,m.start+m.count);for(let f=g,p=x;f<p;f+=3){let y=f,_=f+1,b=f+2;s=Bs(this,a,e,n,c,h,u,y,_,b),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}}};os=class i extends ln{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,m=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new bt(c,3)),this.setAttribute("normal",new bt(h,3)),this.setAttribute("uv",new bt(u,2));function g(x,f,p,y,_,b,S,R,w,N,M){let T=b/w,F=S/N,X=b/2,j=S/2,I=R/2,U=w+1,G=N+1,Y=0,q=0,W=new L;for(let Q=0;Q<G;Q++){let ne=Q*F-j;for(let ue=0;ue<U;ue++){let V=ue*T-X;W[x]=V*y,W[f]=ne*_,W[p]=I,c.push(W.x,W.y,W.z),W[x]=0,W[f]=0,W[p]=R>0?1:-1,h.push(W.x,W.y,W.z),u.push(ue/w),u.push(1-Q/N),Y+=1}}for(let Q=0;Q<N;Q++)for(let ne=0;ne<w;ne++){let ue=d+ne+U*Q,V=d+ne+U*(Q+1),Z=d+(ne+1)+U*(Q+1),he=d+(ne+1)+U*Q;l.push(ue,V,he),l.push(V,Z,he),q+=6}o.addGroup(m,q,M),m+=q,d+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};Pd={clone:Fi,merge:Tt},Id=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ld=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,bn=class extends Ui{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Id,this.fragmentShader=Ld,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Fi(e.uniforms),this.uniformsGroups=Cd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},cr=class extends tn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new tt,this.projectionMatrix=new tt,this.projectionMatrixInverse=new tt,this.coordinateSystem=vn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Rt=class extends cr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ss*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Qi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ss*2*Math.atan(Math.tan(Qi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Qi*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},vi=-90,Mi=1,Ho=class extends tn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Rt(vi,Mi,e,t);s.layers=this.layers,this.add(s);let r=new Rt(vi,Mi,e,t);r.layers=this.layers,this.add(r);let a=new Rt(vi,Mi,e,t);a.layers=this.layers,this.add(a);let o=new Rt(vi,Mi,e,t);o.layers=this.layers,this.add(o);let l=new Rt(vi,Mi,e,t);l.layers=this.layers,this.add(l);let c=new Rt(vi,Mi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===vn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===er)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,c),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(u,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},hr=class extends zt{constructor(e,t,n,s,r,a,o,l,c,h){e=e!==void 0?e:[],t=t!==void 0?t:Ii,super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ko=class extends Mn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];t.encoding!==void 0&&(ts("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===Qn?at:Gt),this.texture=new hr(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:At}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new os(5,5,5),r=new bn({name:"CubemapFromEquirect",uniforms:Fi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:Dn});r.uniforms.tEquirect.value=t;let a=new Wt(s,r),o=t.minFilter;return t.minFilter===ei&&(t.minFilter=At),new Ho(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},Eo=new L,Dd=new L,Nd=new ke,Ft=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Eo.subVectors(n,t).cross(Dd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Eo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Nd.getNormalMatrix(e),s=this.coplanarPoint(Eo).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},qn=new ti,zs=new L,Oi=class{constructor(e=new Ft,t=new Ft,n=new Ft,s=new Ft,r=new Ft,a=new Ft){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=vn){let n=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],m=s[8],g=s[9],x=s[10],f=s[11],p=s[12],y=s[13],_=s[14],b=s[15];if(n[0].setComponents(l-r,d-c,f-m,b-p).normalize(),n[1].setComponents(l+r,d+c,f+m,b+p).normalize(),n[2].setComponents(l+a,d+h,f+g,b+y).normalize(),n[3].setComponents(l-a,d-h,f-g,b-y).normalize(),n[4].setComponents(l-o,d-u,f-x,b-_).normalize(),t===vn)n[5].setComponents(l+o,d+u,f+x,b+_).normalize();else if(t===er)n[5].setComponents(o,u,x,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),qn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),qn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(qn)}intersectsSprite(e){return qn.center.set(0,0,0),qn.radius=.7071067811865476,qn.applyMatrix4(e.matrixWorld),this.intersectsSphere(qn)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(zs.x=s.normal.x>0?e.max.x:e.min.x,zs.y=s.normal.y>0?e.max.y:e.min.y,zs.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(zs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};Vo=class i extends ln{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=e/o,d=t/l,m=[],g=[],x=[],f=[];for(let p=0;p<h;p++){let y=p*d-a;for(let _=0;_<c;_++){let b=_*u-r;g.push(b,-y,0),x.push(0,0,1),f.push(_/o),f.push(1-p/l)}}for(let p=0;p<l;p++)for(let y=0;y<o;y++){let _=y+c*p,b=y+c*(p+1),S=y+1+c*(p+1),R=y+1+c*p;m.push(_,b,R),m.push(b,S,R)}this.setIndex(m),this.setAttribute("position",new bt(g,3)),this.setAttribute("normal",new bt(x,3)),this.setAttribute("uv",new bt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},Fd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Od=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Bd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,zd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Hd=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,kd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Vd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Gd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Wd=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Xd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Yd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,qd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,$d=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Zd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Kd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Jd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,jd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Qd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ef=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,tf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,nf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,sf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,rf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,of=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,af=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,lf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,cf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,hf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,uf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,df=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ff="gl_FragColor = linearToOutputTexel( gl_FragColor );",pf=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,mf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,gf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,xf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,_f=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,yf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,vf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Mf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,bf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Sf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ef=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,wf=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Tf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Af=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Rf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Cf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Pf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,If=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Lf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Df=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Nf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Uf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Ff=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Of=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Bf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,zf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Hf=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,kf=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Vf=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Gf=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Wf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Xf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Yf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,qf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$f=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Kf=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Jf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,jf=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Qf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,ep=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,tp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,np=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ip=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,sp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,rp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,op=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,ap=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,lp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,cp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,hp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,up=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,dp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,fp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,pp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,mp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,gp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,xp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,_p=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,yp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,vp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Mp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,bp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Sp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ep=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,wp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Tp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Ap=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Rp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Cp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Pp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Ip=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Lp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Dp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Np=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Up=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Fp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Op=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Vp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Gp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,Wp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Xp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,qp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$p=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Zp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Kp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Jp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,em=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,tm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,im=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,sm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,rm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,om=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,am=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,um=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,dm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,pm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,mm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Fe={alphahash_fragment:Fd,alphahash_pars_fragment:Od,alphamap_fragment:Bd,alphamap_pars_fragment:zd,alphatest_fragment:Hd,alphatest_pars_fragment:kd,aomap_fragment:Vd,aomap_pars_fragment:Gd,batching_pars_vertex:Wd,batching_vertex:Xd,begin_vertex:Yd,beginnormal_vertex:qd,bsdfs:$d,iridescence_fragment:Zd,bumpmap_pars_fragment:Kd,clipping_planes_fragment:Jd,clipping_planes_pars_fragment:jd,clipping_planes_pars_vertex:Qd,clipping_planes_vertex:ef,color_fragment:tf,color_pars_fragment:nf,color_pars_vertex:sf,color_vertex:rf,common:of,cube_uv_reflection_fragment:af,defaultnormal_vertex:lf,displacementmap_pars_vertex:cf,displacementmap_vertex:hf,emissivemap_fragment:uf,emissivemap_pars_fragment:df,colorspace_fragment:ff,colorspace_pars_fragment:pf,envmap_fragment:mf,envmap_common_pars_fragment:gf,envmap_pars_fragment:xf,envmap_pars_vertex:_f,envmap_physical_pars_fragment:Pf,envmap_vertex:yf,fog_vertex:vf,fog_pars_vertex:Mf,fog_fragment:bf,fog_pars_fragment:Sf,gradientmap_pars_fragment:Ef,lightmap_fragment:wf,lightmap_pars_fragment:Tf,lights_lambert_fragment:Af,lights_lambert_pars_fragment:Rf,lights_pars_begin:Cf,lights_toon_fragment:If,lights_toon_pars_fragment:Lf,lights_phong_fragment:Df,lights_phong_pars_fragment:Nf,lights_physical_fragment:Uf,lights_physical_pars_fragment:Ff,lights_fragment_begin:Of,lights_fragment_maps:Bf,lights_fragment_end:zf,logdepthbuf_fragment:Hf,logdepthbuf_pars_fragment:kf,logdepthbuf_pars_vertex:Vf,logdepthbuf_vertex:Gf,map_fragment:Wf,map_pars_fragment:Xf,map_particle_fragment:Yf,map_particle_pars_fragment:qf,metalnessmap_fragment:$f,metalnessmap_pars_fragment:Zf,morphcolor_vertex:Kf,morphnormal_vertex:Jf,morphtarget_pars_vertex:jf,morphtarget_vertex:Qf,normal_fragment_begin:ep,normal_fragment_maps:tp,normal_pars_fragment:np,normal_pars_vertex:ip,normal_vertex:sp,normalmap_pars_fragment:rp,clearcoat_normal_fragment_begin:op,clearcoat_normal_fragment_maps:ap,clearcoat_pars_fragment:lp,iridescence_pars_fragment:cp,opaque_fragment:hp,packing:up,premultiplied_alpha_fragment:dp,project_vertex:fp,dithering_fragment:pp,dithering_pars_fragment:mp,roughnessmap_fragment:gp,roughnessmap_pars_fragment:xp,shadowmap_pars_fragment:_p,shadowmap_pars_vertex:yp,shadowmap_vertex:vp,shadowmask_pars_fragment:Mp,skinbase_vertex:bp,skinning_pars_vertex:Sp,skinning_vertex:Ep,skinnormal_vertex:wp,specularmap_fragment:Tp,specularmap_pars_fragment:Ap,tonemapping_fragment:Rp,tonemapping_pars_fragment:Cp,transmission_fragment:Pp,transmission_pars_fragment:Ip,uv_pars_fragment:Lp,uv_pars_vertex:Dp,uv_vertex:Np,worldpos_vertex:Up,background_vert:Fp,background_frag:Op,backgroundCube_vert:Bp,backgroundCube_frag:zp,cube_vert:Hp,cube_frag:kp,depth_vert:Vp,depth_frag:Gp,distanceRGBA_vert:Wp,distanceRGBA_frag:Xp,equirect_vert:Yp,equirect_frag:qp,linedashed_vert:$p,linedashed_frag:Zp,meshbasic_vert:Kp,meshbasic_frag:Jp,meshlambert_vert:jp,meshlambert_frag:Qp,meshmatcap_vert:em,meshmatcap_frag:tm,meshnormal_vert:nm,meshnormal_frag:im,meshphong_vert:sm,meshphong_frag:rm,meshphysical_vert:om,meshphysical_frag:am,meshtoon_vert:lm,meshtoon_frag:cm,points_vert:hm,points_frag:um,shadow_vert:dm,shadow_frag:fm,sprite_vert:pm,sprite_frag:mm},le={common:{diffuse:{value:new Xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new Te(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new Xe(16777215)},opacity:{value:1},center:{value:new Te(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}},on={basic:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:Fe.meshbasic_vert,fragmentShader:Fe.meshbasic_frag},lambert:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Xe(0)}}]),vertexShader:Fe.meshlambert_vert,fragmentShader:Fe.meshlambert_frag},phong:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Xe(0)},specular:{value:new Xe(1118481)},shininess:{value:30}}]),vertexShader:Fe.meshphong_vert,fragmentShader:Fe.meshphong_frag},standard:{uniforms:Tt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag},toon:{uniforms:Tt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Xe(0)}}]),vertexShader:Fe.meshtoon_vert,fragmentShader:Fe.meshtoon_frag},matcap:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:Fe.meshmatcap_vert,fragmentShader:Fe.meshmatcap_frag},points:{uniforms:Tt([le.points,le.fog]),vertexShader:Fe.points_vert,fragmentShader:Fe.points_frag},dashed:{uniforms:Tt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Fe.linedashed_vert,fragmentShader:Fe.linedashed_frag},depth:{uniforms:Tt([le.common,le.displacementmap]),vertexShader:Fe.depth_vert,fragmentShader:Fe.depth_frag},normal:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:Fe.meshnormal_vert,fragmentShader:Fe.meshnormal_frag},sprite:{uniforms:Tt([le.sprite,le.fog]),vertexShader:Fe.sprite_vert,fragmentShader:Fe.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Fe.background_vert,fragmentShader:Fe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Fe.backgroundCube_vert,fragmentShader:Fe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Fe.cube_vert,fragmentShader:Fe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Fe.equirect_vert,fragmentShader:Fe.equirect_frag},distanceRGBA:{uniforms:Tt([le.common,le.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Fe.distanceRGBA_vert,fragmentShader:Fe.distanceRGBA_frag},shadow:{uniforms:Tt([le.lights,le.fog,{color:{value:new Xe(0)},opacity:{value:1}}]),vertexShader:Fe.shadow_vert,fragmentShader:Fe.shadow_frag}};on.physical={uniforms:Tt([on.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new Te(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new Xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new Te},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new Xe(0)},specularColor:{value:new Xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new Te},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag};Hs={r:0,b:0,g:0};Go=class extends cr{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ti=4,kl=[.125,.215,.35,.446,.526,.582],Kn=20,wo=new Go,Vl=new Xe,To=null,Ao=0,Ro=0,$n=(1+Math.sqrt(5))/2,bi=1/$n,Gl=[new L(1,1,1),new L(-1,1,1),new L(1,1,-1),new L(-1,1,-1),new L(0,$n,bi),new L(0,$n,-bi),new L(bi,0,$n),new L(-bi,0,$n),new L($n,bi,0),new L(-$n,bi,0)],ur=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){To=this._renderer.getRenderTarget(),Ao=this._renderer.getActiveCubeFace(),Ro=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Yl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Xl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(To,Ao,Ro),e.scissorTest=!1,ks(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ii||e.mapping===Li?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),To=this._renderer.getRenderTarget(),Ao=this._renderer.getActiveCubeFace(),Ro=this._renderer.getActiveMipmapLevel();let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:At,minFilter:At,generateMipmaps:!1,type:is,format:Ot,colorSpace:en,depthBuffer:!1},s=Wl(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Wl(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=bm(r)),this._blurMaterial=Sm(r,e,t)}return s}_compileMaterial(e){let t=new Wt(this._lodPlanes[0],e);this._renderer.compile(t,wo)}_sceneToCubeUV(e,t,n,s){let o=new Rt(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Vl),h.toneMapping=Nn,h.autoClear=!1;let m=new ni({name:"PMREM.Background",side:It,depthWrite:!1,depthTest:!1}),g=new Wt(new os,m),x=!1,f=e.background;f?f.isColor&&(m.color.copy(f),e.background=null,x=!0):(m.color.copy(Vl),x=!0);for(let p=0;p<6;p++){let y=p%3;y===0?(o.up.set(0,l[p],0),o.lookAt(c[p],0,0)):y===1?(o.up.set(0,0,l[p]),o.lookAt(0,c[p],0)):(o.up.set(0,l[p],0),o.lookAt(0,0,c[p]));let _=this._cubeSize;ks(s,y*_,p>2?_:0,_,_),h.setRenderTarget(s),x&&h.render(g,o),h.render(e,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=f}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Ii||e.mapping===Li;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Yl()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Xl());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new Wt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;ks(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,wo)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){let r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=Gl[(s-1)%Gl.length];this._blur(e,s-1,s,r,a)}t.autoClear=n}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Wt(this._lodPlanes[s],c),d=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Kn-1),x=r/g,f=isFinite(r)?1+Math.floor(h*x):Kn;f>Kn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Kn}`);let p=[],y=0;for(let w=0;w<Kn;++w){let N=w/x,M=Math.exp(-N*N/2);p.push(M),w===0?y+=M:w<f&&(y+=2*M)}for(let w=0;w<p.length;w++)p[w]=p[w]/y;d.envMap.value=e.texture,d.samples.value=f,d.weights.value=p,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:_}=this;d.dTheta.value=g,d.mipInt.value=_-n;let b=this._sizeLods[s],S=3*b*(s>_-Ti?s-_+Ti:0),R=4*(this._cubeSize-b);ks(t,S,R,3*b,2*b),l.setRenderTarget(t),l.render(u,wo)}};dr=class extends zt{constructor(e,t,n,s,r,a,o,l,c,h){if(h=h!==void 0?h:jn,h!==jn&&h!==Di)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===jn&&(n=In),n===void 0&&h===Di&&(n=Jn),super(null,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:ot,this.minFilter=l!==void 0?l:ot,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Ac=new zt,Rc=new dr(1,1);Rc.compareFunction=Mc;Cc=new rr,Pc=new zo,Ic=new hr,ql=[],$l=[],Zl=new Float32Array(16),Kl=new Float32Array(9),Jl=new Float32Array(4);Wo=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=jm(t.type)}},Xo=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=_g(t.type)}},Yo=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Co=/(\w+)(\])?(\[|\.)?/g;Pi=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);yg(r,a,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};vg=37297,Mg=0;Pg=/^[ \t]*#include +<([\w\d./]+)>/gm;Ig=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);Dg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;kg=0,$o=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Zo(e),t.set(e,n)),n}},Zo=class{constructor(e){this.id=kg++,this.code=e,this.usedTimes=0}};$g=0;Ko=class extends Ui{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Gu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Jo=class extends Ui{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},jg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Qg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;jo=class extends Rt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Qt=class extends tn{constructor(){super(),this.isGroup=!0,this.type="Group"}},s0={type:"move"},ns=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Qt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Qt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Qt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let x of e.hand.values()){let f=t.getJointPose(x,n),p=this._getHandJoint(c,x);f!==null&&(p.matrix.fromArray(f.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=f.radius),p.visible=f!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),m=.02,g=.005;c.inputState.pinching&&d>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(s0)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Qt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Qo=class extends an{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,m=null,g=null,x=t.getContextAttributes(),f=null,p=null,y=[],_=[],b=new Te,S=null,R=new Rt;R.layers.enable(1),R.viewport=new gt;let w=new Rt;w.layers.enable(2),w.viewport=new gt;let N=[R,w],M=new jo;M.layers.enable(1),M.layers.enable(2);let T=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(V){let Z=y[V];return Z===void 0&&(Z=new ns,y[V]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(V){let Z=y[V];return Z===void 0&&(Z=new ns,y[V]=Z),Z.getGripSpace()},this.getHand=function(V){let Z=y[V];return Z===void 0&&(Z=new ns,y[V]=Z),Z.getHandSpace()};function X(V){let Z=_.indexOf(V.inputSource);if(Z===-1)return;let he=y[Z];he!==void 0&&(he.update(V.inputSource,V.frame,c||a),he.dispatchEvent({type:V.type,data:V.inputSource}))}function j(){s.removeEventListener("select",X),s.removeEventListener("selectstart",X),s.removeEventListener("selectend",X),s.removeEventListener("squeeze",X),s.removeEventListener("squeezestart",X),s.removeEventListener("squeezeend",X),s.removeEventListener("end",j),s.removeEventListener("inputsourceschange",I);for(let V=0;V<y.length;V++){let Z=_[V];Z!==null&&(_[V]=null,y[V].disconnect(Z))}T=null,F=null,e.setRenderTarget(f),m=null,d=null,u=null,s=null,p=null,ue.stop(),n.isPresenting=!1,e.setPixelRatio(S),e.setSize(b.width,b.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(V){r=V,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(V){o=V,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(V){c=V},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(V){if(s=V,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",X),s.addEventListener("selectstart",X),s.addEventListener("selectend",X),s.addEventListener("squeeze",X),s.addEventListener("squeezestart",X),s.addEventListener("squeezeend",X),s.addEventListener("end",j),s.addEventListener("inputsourceschange",I),x.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(b),s.renderState.layers===void 0||e.capabilities.isWebGL2===!1){let Z={antialias:s.renderState.layers===void 0?x.antialias:!0,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,Z),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),p=new Mn(m.framebufferWidth,m.framebufferHeight,{format:Ot,type:Un,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil})}else{let Z=null,he=null,_e=null;x.depth&&(_e=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Z=x.stencil?Di:jn,he=x.stencil?Jn:In);let ge={colorFormat:t.RGBA8,depthFormat:_e,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(ge),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),p=new Mn(d.textureWidth,d.textureHeight,{format:Ot,type:Un,depthTexture:new dr(d.textureWidth,d.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,Z),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0});let Ce=e.properties.get(p);Ce.__ignoreDepthValues=d.ignoreDepthValues}p.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),ue.setContext(s),ue.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function I(V){for(let Z=0;Z<V.removed.length;Z++){let he=V.removed[Z],_e=_.indexOf(he);_e>=0&&(_[_e]=null,y[_e].disconnect(he))}for(let Z=0;Z<V.added.length;Z++){let he=V.added[Z],_e=_.indexOf(he);if(_e===-1){for(let Ce=0;Ce<y.length;Ce++)if(Ce>=_.length){_.push(he),_e=Ce;break}else if(_[Ce]===null){_[Ce]=he,_e=Ce;break}if(_e===-1)break}let ge=y[_e];ge&&ge.connect(he)}}let U=new L,G=new L;function Y(V,Z,he){U.setFromMatrixPosition(Z.matrixWorld),G.setFromMatrixPosition(he.matrixWorld);let _e=U.distanceTo(G),ge=Z.projectionMatrix.elements,Ce=he.projectionMatrix.elements,Pe=ge[14]/(ge[10]-1),Se=ge[14]/(ge[10]+1),Ve=(ge[9]+1)/ge[5],O=(ge[9]-1)/ge[5],ut=(ge[8]-1)/ge[0],Me=(Ce[8]+1)/Ce[0],Ae=Pe*ut,pe=Pe*Me,Ke=_e/(-ut+Me),Ie=Ke*-ut;Z.matrixWorld.decompose(V.position,V.quaternion,V.scale),V.translateX(Ie),V.translateZ(Ke),V.matrixWorld.compose(V.position,V.quaternion,V.scale),V.matrixWorldInverse.copy(V.matrixWorld).invert();let A=Pe+Ke,v=Se+Ke,B=Ae-Ie,te=pe+(_e-Ie),J=Ve*Se/v*A,ee=O*Se/v*A;V.projectionMatrix.makePerspective(B,te,J,ee,A,v),V.projectionMatrixInverse.copy(V.projectionMatrix).invert()}function q(V,Z){Z===null?V.matrixWorld.copy(V.matrix):V.matrixWorld.multiplyMatrices(Z.matrixWorld,V.matrix),V.matrixWorldInverse.copy(V.matrixWorld).invert()}this.updateCamera=function(V){if(s===null)return;M.near=w.near=R.near=V.near,M.far=w.far=R.far=V.far,(T!==M.near||F!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),T=M.near,F=M.far);let Z=V.parent,he=M.cameras;q(M,Z);for(let _e=0;_e<he.length;_e++)q(he[_e],Z);he.length===2?Y(M,R,w):M.projectionMatrix.copy(R.projectionMatrix),W(V,M,Z)};function W(V,Z,he){he===null?V.matrix.copy(Z.matrixWorld):(V.matrix.copy(he.matrixWorld),V.matrix.invert(),V.matrix.multiply(Z.matrixWorld)),V.matrix.decompose(V.position,V.quaternion,V.scale),V.updateMatrixWorld(!0),V.projectionMatrix.copy(Z.projectionMatrix),V.projectionMatrixInverse.copy(Z.projectionMatrixInverse),V.isPerspectiveCamera&&(V.fov=ss*2*Math.atan(1/V.projectionMatrix.elements[5]),V.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(V){l=V,d!==null&&(d.fixedFoveation=V),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=V)};let Q=null;function ne(V,Z){if(h=Z.getViewerPose(c||a),g=Z,h!==null){let he=h.views;m!==null&&(e.setRenderTargetFramebuffer(p,m.framebuffer),e.setRenderTarget(p));let _e=!1;he.length!==M.cameras.length&&(M.cameras.length=0,_e=!0);for(let ge=0;ge<he.length;ge++){let Ce=he[ge],Pe=null;if(m!==null)Pe=m.getViewport(Ce);else{let Ve=u.getViewSubImage(d,Ce);Pe=Ve.viewport,ge===0&&(e.setRenderTargetTextures(p,Ve.colorTexture,d.ignoreDepthValues?void 0:Ve.depthStencilTexture),e.setRenderTarget(p))}let Se=N[ge];Se===void 0&&(Se=new Rt,Se.layers.enable(ge),Se.viewport=new gt,N[ge]=Se),Se.matrix.fromArray(Ce.transform.matrix),Se.matrix.decompose(Se.position,Se.quaternion,Se.scale),Se.projectionMatrix.fromArray(Ce.projectionMatrix),Se.projectionMatrixInverse.copy(Se.projectionMatrix).invert(),Se.viewport.set(Pe.x,Pe.y,Pe.width,Pe.height),ge===0&&(M.matrix.copy(Se.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),_e===!0&&M.cameras.push(Se)}}for(let he=0;he<y.length;he++){let _e=_[he],ge=y[he];_e!==null&&ge!==void 0&&ge.update(_e,Z,c||a)}Q&&Q(V,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),g=null}let ue=new Tc;ue.setAnimationLoop(ne),this.setAnimationLoop=function(V){Q=V},this.dispose=function(){}}};as=class{constructor(e={}){let{canvas:t=pd(),context:n=null,depth:s=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let d;n!==null?d=n.getContextAttributes().alpha:d=a;let m=new Uint32Array(4),g=new Int32Array(4),x=null,f=null,p=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=at,this._useLegacyLights=!1,this.toneMapping=Nn,this.toneMappingExposure=1;let _=this,b=!1,S=0,R=0,w=null,N=-1,M=null,T=new gt,F=new gt,X=null,j=new Xe(0),I=0,U=t.width,G=t.height,Y=1,q=null,W=null,Q=new gt(0,0,U,G),ne=new gt(0,0,U,G),ue=!1,V=new Oi,Z=!1,he=!1,_e=null,ge=new tt,Ce=new Te,Pe=new L,Se={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Ve(){return w===null?Y:1}let O=n;function ut(E,D){for(let H=0;H<E.length;H++){let k=E[H],z=t.getContext(k,D);if(z!==null)return z}return null}try{let E={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r160"),t.addEventListener("webglcontextlost",oe,!1),t.addEventListener("webglcontextrestored",P,!1),t.addEventListener("webglcontextcreationerror",se,!1),O===null){let D=["webgl2","webgl","experimental-webgl"];if(_.isWebGL1Renderer===!0&&D.shift(),O=ut(D,E),O===null)throw ut(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&O instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),O.getShaderPrecisionFormat===void 0&&(O.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let Me,Ae,pe,Ke,Ie,A,v,B,te,J,ee,me,ce,fe,Ee,De,K,Ge,C,$,ae,ie,xe,ze;function We(){Me=new wm(O),Ae=new ym(O,Me,e),Me.init(Ae),ie=new i0(O,Me,Ae),pe=new t0(O,Me,Ae),Ke=new Rm(O),Ie=new Gg,A=new n0(O,Me,pe,Ie,Ae,ie,Ke),v=new Mm(_),B=new Em(_),te=new Ud(O,Ae),xe=new xm(O,Me,te,Ae),J=new Tm(O,te,Ke,xe),ee=new Lm(O,J,te,Ke),C=new Im(O,Ae,A),De=new vm(Ie),me=new Vg(_,v,B,Me,Ae,xe,De),ce=new r0(_,Ie),fe=new Xg,Ee=new Jg(Me,Ae),Ge=new gm(_,v,B,pe,ee,d,l),K=new e0(_,ee,Ae),ze=new o0(O,Ke,Ae,pe),$=new _m(O,Me,Ke,Ae),ae=new Am(O,Me,Ke,Ae),Ke.programs=me.programs,_.capabilities=Ae,_.extensions=Me,_.properties=Ie,_.renderLists=fe,_.shadowMap=K,_.state=pe,_.info=Ke}We();let Oe=new Qo(_,O);this.xr=Oe,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let E=Me.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=Me.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(E){E!==void 0&&(Y=E,this.setSize(U,G,!1))},this.getSize=function(E){return E.set(U,G)},this.setSize=function(E,D,H=!0){if(Oe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}U=E,G=D,t.width=Math.floor(E*Y),t.height=Math.floor(D*Y),H===!0&&(t.style.width=E+"px",t.style.height=D+"px"),this.setViewport(0,0,E,D)},this.getDrawingBufferSize=function(E){return E.set(U*Y,G*Y).floor()},this.setDrawingBufferSize=function(E,D,H){U=E,G=D,Y=H,t.width=Math.floor(E*H),t.height=Math.floor(D*H),this.setViewport(0,0,E,D)},this.getCurrentViewport=function(E){return E.copy(T)},this.getViewport=function(E){return E.copy(Q)},this.setViewport=function(E,D,H,k){E.isVector4?Q.set(E.x,E.y,E.z,E.w):Q.set(E,D,H,k),pe.viewport(T.copy(Q).multiplyScalar(Y).floor())},this.getScissor=function(E){return E.copy(ne)},this.setScissor=function(E,D,H,k){E.isVector4?ne.set(E.x,E.y,E.z,E.w):ne.set(E,D,H,k),pe.scissor(F.copy(ne).multiplyScalar(Y).floor())},this.getScissorTest=function(){return ue},this.setScissorTest=function(E){pe.setScissorTest(ue=E)},this.setOpaqueSort=function(E){q=E},this.setTransparentSort=function(E){W=E},this.getClearColor=function(E){return E.copy(Ge.getClearColor())},this.setClearColor=function(){Ge.setClearColor.apply(Ge,arguments)},this.getClearAlpha=function(){return Ge.getClearAlpha()},this.setClearAlpha=function(){Ge.setClearAlpha.apply(Ge,arguments)},this.clear=function(E=!0,D=!0,H=!0){let k=0;if(E){let z=!1;if(w!==null){let de=w.texture.format;z=de===yc||de===_c||de===xc}if(z){let de=w.texture.type,ve=de===Un||de===In||de===da||de===Jn||de===mc||de===gc,we=Ge.getClearColor(),Re=Ge.getClearAlpha(),Be=we.r,Le=we.g,Ne=we.b;ve?(m[0]=Be,m[1]=Le,m[2]=Ne,m[3]=Re,O.clearBufferuiv(O.COLOR,0,m)):(g[0]=Be,g[1]=Le,g[2]=Ne,g[3]=Re,O.clearBufferiv(O.COLOR,0,g))}else k|=O.COLOR_BUFFER_BIT}D&&(k|=O.DEPTH_BUFFER_BIT),H&&(k|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",oe,!1),t.removeEventListener("webglcontextrestored",P,!1),t.removeEventListener("webglcontextcreationerror",se,!1),fe.dispose(),Ee.dispose(),Ie.dispose(),v.dispose(),B.dispose(),ee.dispose(),xe.dispose(),ze.dispose(),me.dispose(),Oe.dispose(),Oe.removeEventListener("sessionstart",St),Oe.removeEventListener("sessionend",Ze),_e&&(_e.dispose(),_e=null),Et.stop()};function oe(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function P(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let E=Ke.autoReset,D=K.enabled,H=K.autoUpdate,k=K.needsUpdate,z=K.type;We(),Ke.autoReset=E,K.enabled=D,K.autoUpdate=H,K.needsUpdate=k,K.type=z}function se(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function re(E){let D=E.target;D.removeEventListener("dispose",re),be(D)}function be(E){ye(E),Ie.remove(E)}function ye(E){let D=Ie.get(E).programs;D!==void 0&&(D.forEach(function(H){me.releaseProgram(H)}),E.isShaderMaterial&&me.releaseShaderCache(E))}this.renderBufferDirect=function(E,D,H,k,z,de){D===null&&(D=Se);let ve=z.isMesh&&z.matrixWorld.determinant()<0,we=Wh(E,D,H,k,z);pe.setMaterial(k,ve);let Re=H.index,Be=1;if(k.wireframe===!0){if(Re=J.getWireframeAttribute(H),Re===void 0)return;Be=2}let Le=H.drawRange,Ne=H.attributes.position,it=Le.start*Be,Dt=(Le.start+Le.count)*Be;de!==null&&(it=Math.max(it,de.start*Be),Dt=Math.min(Dt,(de.start+de.count)*Be)),Re!==null?(it=Math.max(it,0),Dt=Math.min(Dt,Re.count)):Ne!=null&&(it=Math.max(it,0),Dt=Math.min(Dt,Ne.count));let ft=Dt-it;if(ft<0||ft===1/0)return;xe.setup(z,k,we,H,Re);let fn,et=$;if(Re!==null&&(fn=te.get(Re),et=ae,et.setIndex(fn)),z.isMesh)k.wireframe===!0?(pe.setLineWidth(k.wireframeLinewidth*Ve()),et.setMode(O.LINES)):et.setMode(O.TRIANGLES);else if(z.isLine){let He=k.linewidth;He===void 0&&(He=1),pe.setLineWidth(He*Ve()),z.isLineSegments?et.setMode(O.LINES):z.isLineLoop?et.setMode(O.LINE_LOOP):et.setMode(O.LINE_STRIP)}else z.isPoints?et.setMode(O.POINTS):z.isSprite&&et.setMode(O.TRIANGLES);if(z.isBatchedMesh)et.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else if(z.isInstancedMesh)et.renderInstances(it,ft,z.count);else if(H.isInstancedBufferGeometry){let He=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Jr=Math.min(H.instanceCount,He);et.renderInstances(it,ft,Jr)}else et.render(it,ft)};function Ye(E,D,H){E.transparent===!0&&E.side===Jt&&E.forceSinglePass===!1?(E.side=It,E.needsUpdate=!0,ys(E,D,H),E.side=Fn,E.needsUpdate=!0,ys(E,D,H),E.side=Jt):ys(E,D,H)}this.compile=function(E,D,H=null){H===null&&(H=E),f=Ee.get(H),f.init(),y.push(f),H.traverseVisible(function(z){z.isLight&&z.layers.test(D.layers)&&(f.pushLight(z),z.castShadow&&f.pushShadow(z))}),E!==H&&E.traverseVisible(function(z){z.isLight&&z.layers.test(D.layers)&&(f.pushLight(z),z.castShadow&&f.pushShadow(z))}),f.setupLights(_._useLegacyLights);let k=new Set;return E.traverse(function(z){let de=z.material;if(de)if(Array.isArray(de))for(let ve=0;ve<de.length;ve++){let we=de[ve];Ye(we,H,z),k.add(we)}else Ye(de,H,z),k.add(de)}),y.pop(),f=null,k},this.compileAsync=function(E,D,H=null){let k=this.compile(E,D,H);return new Promise(z=>{function de(){if(k.forEach(function(ve){Ie.get(ve).currentProgram.isReady()&&k.delete(ve)}),k.size===0){z(E);return}setTimeout(de,10)}Me.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let qe=null;function dt(E){qe&&qe(E)}function St(){Et.stop()}function Ze(){Et.start()}let Et=new Tc;Et.setAnimationLoop(dt),typeof self<"u"&&Et.setContext(self),this.setAnimationLoop=function(E){qe=E,Oe.setAnimationLoop(E),E===null?Et.stop():Et.start()},Oe.addEventListener("sessionstart",St),Oe.addEventListener("sessionend",Ze),this.render=function(E,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),Oe.enabled===!0&&Oe.isPresenting===!0&&(Oe.cameraAutoUpdate===!0&&Oe.updateCamera(D),D=Oe.getCamera()),E.isScene===!0&&E.onBeforeRender(_,E,D,w),f=Ee.get(E,y.length),f.init(),y.push(f),ge.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),V.setFromProjectionMatrix(ge),he=this.localClippingEnabled,Z=De.init(this.clippingPlanes,he),x=fe.get(E,p.length),x.init(),p.push(x),rn(E,D,0,_.sortObjects),x.finish(),_.sortObjects===!0&&x.sort(q,W),this.info.render.frame++,Z===!0&&De.beginShadows();let H=f.state.shadowsArray;if(K.render(H,E,D),Z===!0&&De.endShadows(),this.info.autoReset===!0&&this.info.reset(),Ge.render(x,E),f.setupLights(_._useLegacyLights),D.isArrayCamera){let k=D.cameras;for(let z=0,de=k.length;z<de;z++){let ve=k[z];Fa(x,E,ve,ve.viewport)}}else Fa(x,E,D);w!==null&&(A.updateMultisampleRenderTarget(w),A.updateRenderTargetMipmap(w)),E.isScene===!0&&E.onAfterRender(_,E,D),xe.resetDefaultState(),N=-1,M=null,y.pop(),y.length>0?f=y[y.length-1]:f=null,p.pop(),p.length>0?x=p[p.length-1]:x=null};function rn(E,D,H,k){if(E.visible===!1)return;if(E.layers.test(D.layers)){if(E.isGroup)H=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(D);else if(E.isLight)f.pushLight(E),E.castShadow&&f.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||V.intersectsSprite(E)){k&&Pe.setFromMatrixPosition(E.matrixWorld).applyMatrix4(ge);let ve=ee.update(E),we=E.material;we.visible&&x.push(E,ve,we,H,Pe.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||V.intersectsObject(E))){let ve=ee.update(E),we=E.material;if(k&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Pe.copy(E.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),Pe.copy(ve.boundingSphere.center)),Pe.applyMatrix4(E.matrixWorld).applyMatrix4(ge)),Array.isArray(we)){let Re=ve.groups;for(let Be=0,Le=Re.length;Be<Le;Be++){let Ne=Re[Be],it=we[Ne.materialIndex];it&&it.visible&&x.push(E,ve,it,H,Pe.z,Ne)}}else we.visible&&x.push(E,ve,we,H,Pe.z,null)}}let de=E.children;for(let ve=0,we=de.length;ve<we;ve++)rn(de[ve],D,H,k)}function Fa(E,D,H,k){let z=E.opaque,de=E.transmissive,ve=E.transparent;f.setupLightsView(H),Z===!0&&De.setGlobalState(_.clippingPlanes,H),de.length>0&&Gh(z,de,D,H),k&&pe.viewport(T.copy(k)),z.length>0&&_s(z,D,H),de.length>0&&_s(de,D,H),ve.length>0&&_s(ve,D,H),pe.buffers.depth.setTest(!0),pe.buffers.depth.setMask(!0),pe.buffers.color.setMask(!0),pe.setPolygonOffset(!1)}function Gh(E,D,H,k){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;let de=Ae.isWebGL2;_e===null&&(_e=new Mn(1,1,{generateMipmaps:!0,type:Me.has("EXT_color_buffer_half_float")?is:Un,minFilter:ei,samples:de?4:0})),_.getDrawingBufferSize(Ce),de?_e.setSize(Ce.x,Ce.y):_e.setSize(tr(Ce.x),tr(Ce.y));let ve=_.getRenderTarget();_.setRenderTarget(_e),_.getClearColor(j),I=_.getClearAlpha(),I<1&&_.setClearColor(16777215,.5),_.clear();let we=_.toneMapping;_.toneMapping=Nn,_s(E,H,k),A.updateMultisampleRenderTarget(_e),A.updateRenderTargetMipmap(_e);let Re=!1;for(let Be=0,Le=D.length;Be<Le;Be++){let Ne=D[Be],it=Ne.object,Dt=Ne.geometry,ft=Ne.material,fn=Ne.group;if(ft.side===Jt&&it.layers.test(k.layers)){let et=ft.side;ft.side=It,ft.needsUpdate=!0,Oa(it,H,k,Dt,ft,fn),ft.side=et,ft.needsUpdate=!0,Re=!0}}Re===!0&&(A.updateMultisampleRenderTarget(_e),A.updateRenderTargetMipmap(_e)),_.setRenderTarget(ve),_.setClearColor(j,I),_.toneMapping=we}function _s(E,D,H){let k=D.isScene===!0?D.overrideMaterial:null;for(let z=0,de=E.length;z<de;z++){let ve=E[z],we=ve.object,Re=ve.geometry,Be=k===null?ve.material:k,Le=ve.group;we.layers.test(H.layers)&&Oa(we,D,H,Re,Be,Le)}}function Oa(E,D,H,k,z,de){E.onBeforeRender(_,D,H,k,z,de),E.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),z.onBeforeRender(_,D,H,k,E,de),z.transparent===!0&&z.side===Jt&&z.forceSinglePass===!1?(z.side=It,z.needsUpdate=!0,_.renderBufferDirect(H,D,k,z,E,de),z.side=Fn,z.needsUpdate=!0,_.renderBufferDirect(H,D,k,z,E,de),z.side=Jt):_.renderBufferDirect(H,D,k,z,E,de),E.onAfterRender(_,D,H,k,z,de)}function ys(E,D,H){D.isScene!==!0&&(D=Se);let k=Ie.get(E),z=f.state.lights,de=f.state.shadowsArray,ve=z.state.version,we=me.getParameters(E,z.state,de,D,H),Re=me.getProgramCacheKey(we),Be=k.programs;k.environment=E.isMeshStandardMaterial?D.environment:null,k.fog=D.fog,k.envMap=(E.isMeshStandardMaterial?B:v).get(E.envMap||k.environment),Be===void 0&&(E.addEventListener("dispose",re),Be=new Map,k.programs=Be);let Le=Be.get(Re);if(Le!==void 0){if(k.currentProgram===Le&&k.lightsStateVersion===ve)return za(E,we),Le}else we.uniforms=me.getUniforms(E),E.onBuild(H,we,_),E.onBeforeCompile(we,_),Le=me.acquireProgram(we,Re),Be.set(Re,Le),k.uniforms=we.uniforms;let Ne=k.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ne.clippingPlanes=De.uniform),za(E,we),k.needsLights=Yh(E),k.lightsStateVersion=ve,k.needsLights&&(Ne.ambientLightColor.value=z.state.ambient,Ne.lightProbe.value=z.state.probe,Ne.directionalLights.value=z.state.directional,Ne.directionalLightShadows.value=z.state.directionalShadow,Ne.spotLights.value=z.state.spot,Ne.spotLightShadows.value=z.state.spotShadow,Ne.rectAreaLights.value=z.state.rectArea,Ne.ltc_1.value=z.state.rectAreaLTC1,Ne.ltc_2.value=z.state.rectAreaLTC2,Ne.pointLights.value=z.state.point,Ne.pointLightShadows.value=z.state.pointShadow,Ne.hemisphereLights.value=z.state.hemi,Ne.directionalShadowMap.value=z.state.directionalShadowMap,Ne.directionalShadowMatrix.value=z.state.directionalShadowMatrix,Ne.spotShadowMap.value=z.state.spotShadowMap,Ne.spotLightMatrix.value=z.state.spotLightMatrix,Ne.spotLightMap.value=z.state.spotLightMap,Ne.pointShadowMap.value=z.state.pointShadowMap,Ne.pointShadowMatrix.value=z.state.pointShadowMatrix),k.currentProgram=Le,k.uniformsList=null,Le}function Ba(E){if(E.uniformsList===null){let D=E.currentProgram.getUniforms();E.uniformsList=Pi.seqWithValue(D.seq,E.uniforms)}return E.uniformsList}function za(E,D){let H=Ie.get(E);H.outputColorSpace=D.outputColorSpace,H.batching=D.batching,H.instancing=D.instancing,H.instancingColor=D.instancingColor,H.skinning=D.skinning,H.morphTargets=D.morphTargets,H.morphNormals=D.morphNormals,H.morphColors=D.morphColors,H.morphTargetsCount=D.morphTargetsCount,H.numClippingPlanes=D.numClippingPlanes,H.numIntersection=D.numClipIntersection,H.vertexAlphas=D.vertexAlphas,H.vertexTangents=D.vertexTangents,H.toneMapping=D.toneMapping}function Wh(E,D,H,k,z){D.isScene!==!0&&(D=Se),A.resetTextureUnits();let de=D.fog,ve=k.isMeshStandardMaterial?D.environment:null,we=w===null?_.outputColorSpace:w.isXRRenderTarget===!0?w.texture.colorSpace:en,Re=(k.isMeshStandardMaterial?B:v).get(k.envMap||ve),Be=k.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Le=!!H.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ne=!!H.morphAttributes.position,it=!!H.morphAttributes.normal,Dt=!!H.morphAttributes.color,ft=Nn;k.toneMapped&&(w===null||w.isXRRenderTarget===!0)&&(ft=_.toneMapping);let fn=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,et=fn!==void 0?fn.length:0,He=Ie.get(k),Jr=f.state.lights;if(Z===!0&&(he===!0||E!==M)){let kt=E===M&&k.id===N;De.setState(k,E,kt)}let nt=!1;k.version===He.__version?(He.needsLights&&He.lightsStateVersion!==Jr.state.version||He.outputColorSpace!==we||z.isBatchedMesh&&He.batching===!1||!z.isBatchedMesh&&He.batching===!0||z.isInstancedMesh&&He.instancing===!1||!z.isInstancedMesh&&He.instancing===!0||z.isSkinnedMesh&&He.skinning===!1||!z.isSkinnedMesh&&He.skinning===!0||z.isInstancedMesh&&He.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&He.instancingColor===!1&&z.instanceColor!==null||He.envMap!==Re||k.fog===!0&&He.fog!==de||He.numClippingPlanes!==void 0&&(He.numClippingPlanes!==De.numPlanes||He.numIntersection!==De.numIntersection)||He.vertexAlphas!==Be||He.vertexTangents!==Le||He.morphTargets!==Ne||He.morphNormals!==it||He.morphColors!==Dt||He.toneMapping!==ft||Ae.isWebGL2===!0&&He.morphTargetsCount!==et)&&(nt=!0):(nt=!0,He.__version=k.version);let Vn=He.currentProgram;nt===!0&&(Vn=ys(k,D,z));let Ha=!1,Wi=!1,jr=!1,_t=Vn.getUniforms(),Gn=He.uniforms;if(pe.useProgram(Vn.program)&&(Ha=!0,Wi=!0,jr=!0),k.id!==N&&(N=k.id,Wi=!0),Ha||M!==E){_t.setValue(O,"projectionMatrix",E.projectionMatrix),_t.setValue(O,"viewMatrix",E.matrixWorldInverse);let kt=_t.map.cameraPosition;kt!==void 0&&kt.setValue(O,Pe.setFromMatrixPosition(E.matrixWorld)),Ae.logarithmicDepthBuffer&&_t.setValue(O,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&_t.setValue(O,"isOrthographic",E.isOrthographicCamera===!0),M!==E&&(M=E,Wi=!0,jr=!0)}if(z.isSkinnedMesh){_t.setOptional(O,z,"bindMatrix"),_t.setOptional(O,z,"bindMatrixInverse");let kt=z.skeleton;kt&&(Ae.floatVertexTextures?(kt.boneTexture===null&&kt.computeBoneTexture(),_t.setValue(O,"boneTexture",kt.boneTexture,A)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}z.isBatchedMesh&&(_t.setOptional(O,z,"batchingTexture"),_t.setValue(O,"batchingTexture",z._matricesTexture,A));let Qr=H.morphAttributes;if((Qr.position!==void 0||Qr.normal!==void 0||Qr.color!==void 0&&Ae.isWebGL2===!0)&&C.update(z,H,Vn),(Wi||He.receiveShadow!==z.receiveShadow)&&(He.receiveShadow=z.receiveShadow,_t.setValue(O,"receiveShadow",z.receiveShadow)),k.isMeshGouraudMaterial&&k.envMap!==null&&(Gn.envMap.value=Re,Gn.flipEnvMap.value=Re.isCubeTexture&&Re.isRenderTargetTexture===!1?-1:1),Wi&&(_t.setValue(O,"toneMappingExposure",_.toneMappingExposure),He.needsLights&&Xh(Gn,jr),de&&k.fog===!0&&ce.refreshFogUniforms(Gn,de),ce.refreshMaterialUniforms(Gn,k,Y,G,_e),Pi.upload(O,Ba(He),Gn,A)),k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Pi.upload(O,Ba(He),Gn,A),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&_t.setValue(O,"center",z.center),_t.setValue(O,"modelViewMatrix",z.modelViewMatrix),_t.setValue(O,"normalMatrix",z.normalMatrix),_t.setValue(O,"modelMatrix",z.matrixWorld),k.isShaderMaterial||k.isRawShaderMaterial){let kt=k.uniformsGroups;for(let eo=0,qh=kt.length;eo<qh;eo++)if(Ae.isWebGL2){let ka=kt[eo];ze.update(ka,Vn),ze.bind(ka,Vn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Vn}function Xh(E,D){E.ambientLightColor.needsUpdate=D,E.lightProbe.needsUpdate=D,E.directionalLights.needsUpdate=D,E.directionalLightShadows.needsUpdate=D,E.pointLights.needsUpdate=D,E.pointLightShadows.needsUpdate=D,E.spotLights.needsUpdate=D,E.spotLightShadows.needsUpdate=D,E.rectAreaLights.needsUpdate=D,E.hemisphereLights.needsUpdate=D}function Yh(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(E,D,H){Ie.get(E.texture).__webglTexture=D,Ie.get(E.depthTexture).__webglTexture=H;let k=Ie.get(E);k.__hasExternalTextures=!0,k.__hasExternalTextures&&(k.__autoAllocateDepthBuffer=H===void 0,k.__autoAllocateDepthBuffer||Me.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),k.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(E,D){let H=Ie.get(E);H.__webglFramebuffer=D,H.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(E,D=0,H=0){w=E,S=D,R=H;let k=!0,z=null,de=!1,ve=!1;if(E){let Re=Ie.get(E);Re.__useDefaultFramebuffer!==void 0?(pe.bindFramebuffer(O.FRAMEBUFFER,null),k=!1):Re.__webglFramebuffer===void 0?A.setupRenderTarget(E):Re.__hasExternalTextures&&A.rebindTextures(E,Ie.get(E.texture).__webglTexture,Ie.get(E.depthTexture).__webglTexture);let Be=E.texture;(Be.isData3DTexture||Be.isDataArrayTexture||Be.isCompressedArrayTexture)&&(ve=!0);let Le=Ie.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Le[D])?z=Le[D][H]:z=Le[D],de=!0):Ae.isWebGL2&&E.samples>0&&A.useMultisampledRTT(E)===!1?z=Ie.get(E).__webglMultisampledFramebuffer:Array.isArray(Le)?z=Le[H]:z=Le,T.copy(E.viewport),F.copy(E.scissor),X=E.scissorTest}else T.copy(Q).multiplyScalar(Y).floor(),F.copy(ne).multiplyScalar(Y).floor(),X=ue;if(pe.bindFramebuffer(O.FRAMEBUFFER,z)&&Ae.drawBuffers&&k&&pe.drawBuffers(E,z),pe.viewport(T),pe.scissor(F),pe.setScissorTest(X),de){let Re=Ie.get(E.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+D,Re.__webglTexture,H)}else if(ve){let Re=Ie.get(E.texture),Be=D||0;O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,Re.__webglTexture,H||0,Be)}N=-1},this.readRenderTargetPixels=function(E,D,H,k,z,de,ve){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=Ie.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ve!==void 0&&(we=we[ve]),we){pe.bindFramebuffer(O.FRAMEBUFFER,we);try{let Re=E.texture,Be=Re.format,Le=Re.type;if(Be!==Ot&&ie.convert(Be)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}let Ne=Le===is&&(Me.has("EXT_color_buffer_half_float")||Ae.isWebGL2&&Me.has("EXT_color_buffer_float"));if(Le!==Un&&ie.convert(Le)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Le===Ln&&(Ae.isWebGL2||Me.has("OES_texture_float")||Me.has("WEBGL_color_buffer_float")))&&!Ne){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=E.width-k&&H>=0&&H<=E.height-z&&O.readPixels(D,H,k,z,ie.convert(Be),ie.convert(Le),de)}finally{let Re=w!==null?Ie.get(w).__webglFramebuffer:null;pe.bindFramebuffer(O.FRAMEBUFFER,Re)}}},this.copyFramebufferToTexture=function(E,D,H=0){let k=Math.pow(2,-H),z=Math.floor(D.image.width*k),de=Math.floor(D.image.height*k);A.setTexture2D(D,0),O.copyTexSubImage2D(O.TEXTURE_2D,H,0,0,E.x,E.y,z,de),pe.unbindTexture()},this.copyTextureToTexture=function(E,D,H,k=0){let z=D.image.width,de=D.image.height,ve=ie.convert(H.format),we=ie.convert(H.type);A.setTexture2D(H,0),O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,H.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,H.unpackAlignment),D.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,k,E.x,E.y,z,de,ve,we,D.image.data):D.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,k,E.x,E.y,D.mipmaps[0].width,D.mipmaps[0].height,ve,D.mipmaps[0].data):O.texSubImage2D(O.TEXTURE_2D,k,E.x,E.y,ve,we,D.image),k===0&&H.generateMipmaps&&O.generateMipmap(O.TEXTURE_2D),pe.unbindTexture()},this.copyTextureToTexture3D=function(E,D,H,k,z=0){if(_.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}let de=E.max.x-E.min.x+1,ve=E.max.y-E.min.y+1,we=E.max.z-E.min.z+1,Re=ie.convert(k.format),Be=ie.convert(k.type),Le;if(k.isData3DTexture)A.setTexture3D(k,0),Le=O.TEXTURE_3D;else if(k.isDataArrayTexture||k.isCompressedArrayTexture)A.setTexture2DArray(k,0),Le=O.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,k.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,k.unpackAlignment);let Ne=O.getParameter(O.UNPACK_ROW_LENGTH),it=O.getParameter(O.UNPACK_IMAGE_HEIGHT),Dt=O.getParameter(O.UNPACK_SKIP_PIXELS),ft=O.getParameter(O.UNPACK_SKIP_ROWS),fn=O.getParameter(O.UNPACK_SKIP_IMAGES),et=H.isCompressedTexture?H.mipmaps[z]:H.image;O.pixelStorei(O.UNPACK_ROW_LENGTH,et.width),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,et.height),O.pixelStorei(O.UNPACK_SKIP_PIXELS,E.min.x),O.pixelStorei(O.UNPACK_SKIP_ROWS,E.min.y),O.pixelStorei(O.UNPACK_SKIP_IMAGES,E.min.z),H.isDataTexture||H.isData3DTexture?O.texSubImage3D(Le,z,D.x,D.y,D.z,de,ve,we,Re,Be,et.data):H.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),O.compressedTexSubImage3D(Le,z,D.x,D.y,D.z,de,ve,we,Re,et.data)):O.texSubImage3D(Le,z,D.x,D.y,D.z,de,ve,we,Re,Be,et),O.pixelStorei(O.UNPACK_ROW_LENGTH,Ne),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,it),O.pixelStorei(O.UNPACK_SKIP_PIXELS,Dt),O.pixelStorei(O.UNPACK_SKIP_ROWS,ft),O.pixelStorei(O.UNPACK_SKIP_IMAGES,fn),z===0&&k.generateMipmaps&&O.generateMipmap(Le),pe.unbindTexture()},this.initTexture=function(E){E.isCubeTexture?A.setTextureCube(E,0):E.isData3DTexture?A.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?A.setTexture2DArray(E,0):A.setTexture2D(E,0),pe.unbindTexture()},this.resetState=function(){S=0,R=0,w=null,pe.reset(),xe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return vn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===fa?"display-p3":"srgb",t.unpackColorSpace=$e.workingColorSpace===Mr?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===at?Qn:vc}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===Qn?at:en}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: Three.js r155 lighting migration guide."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: Three.js r155 lighting migration guide."),this._useLegacyLights=e}},ea=class extends as{};ea.prototype.isWebGL1Renderer=!0;fr=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Xe(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},pr=class extends tn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}},mr=class extends zt{constructor(e=null,t=1,n=1,s,r,a,o,l,c=ot,h=ot,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},mt=class extends Bt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Si=new tt,lc=new tt,Vs=[],cc=new Xt,a0=new tt,Zi=new Wt,Ki=new ti,ii=class extends Wt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new mt(new Float32Array(n*16),16),this.instanceColor=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,a0)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Xt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Si),cc.copy(e.boundingBox).applyMatrix4(Si),this.boundingBox.union(cc)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ti),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Si),Ki.copy(e.boundingSphere).applyMatrix4(Si),this.boundingSphere.union(Ki)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Zi.geometry=this.geometry,Zi.material=this.material,Zi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ki.copy(this.boundingSphere),Ki.applyMatrix4(n),e.ray.intersectsSphere(Ki)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Si),lc.multiplyMatrices(n,Si),Zi.matrixWorld=lc,Zi.raycast(e,Vs);for(let a=0,o=Vs.length;a<o;a++){let l=Vs[a];l.instanceId=r,l.object=this,t.push(l)}Vs.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new mt(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}},gr=class extends zt{constructor(e,t,n,s,r,a,o,l,c,h,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isCompressedTexture=!0,this.image={width:t,height:n},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}},xr=class i extends ln{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new L,h=new Te;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let m=n+u/t*s;c.x=e*Math.cos(m),c.y=e*Math.sin(m),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new bt(a,3)),this.setAttribute("normal",new bt(o,3)),this.setAttribute("uv",new bt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}};Bi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ta=class extends Bi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:_l,endingEnd:_l}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case yl:r=e,o=2*t-n;break;case vl:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case yl:a=e,l=2*n-t;break;case vl:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,m=this._weightNext,g=(n-t)/(s-t),x=g*g,f=x*g,p=-d*f+2*d*x-d*g,y=(1+d)*f+(-1.5-2*d)*x+(-.5+d)*g+1,_=(-1-m)*f+(1.5+m)*x+.5*g,b=m*f-m*x;for(let S=0;S!==o;++S)r[S]=p*a[h+S]+y*a[c+S]+_*a[l+S]+b*a[u+S];return r}},na=class extends Bi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},ia=class extends Bi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},nn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Gs(t,this.TimeBufferType),this.values=Gs(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Gs(e.times,Array),values:Gs(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ia(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new na(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ta(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Zs:t=this.InterpolantFactoryMethodDiscrete;break;case Ks:t=this.InterpolantFactoryMethodLinear;break;case oo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Zs;case this.InterpolantFactoryMethodLinear:return Ks;case this.InterpolantFactoryMethodSmooth:return oo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&l0(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===oo,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,m=u+n;for(let g=0;g!==n;++g){let x=t[u+g];if(x!==t[d+g]||x!==t[m+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let m=0;m!==n;++m)t[d+m]=t[u+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=Ks;si=class extends nn{};si.prototype.ValueTypeName="bool";si.prototype.ValueBufferType=Array;si.prototype.DefaultInterpolation=Zs;si.prototype.InterpolantFactoryMethodLinear=void 0;si.prototype.InterpolantFactoryMethodSmooth=void 0;sa=class extends nn{};sa.prototype.ValueTypeName="color";ra=class extends nn{};ra.prototype.ValueTypeName="number";oa=class extends Bi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)Ht.slerpFlat(r,0,a,c-o,a,c,l);return r}},ls=class extends nn{InterpolantFactoryMethodLinear(e){return new oa(this.times,this.values,this.getValueSize(),e)}};ls.prototype.ValueTypeName="quaternion";ls.prototype.DefaultInterpolation=Ks;ls.prototype.InterpolantFactoryMethodSmooth=void 0;ri=class extends nn{};ri.prototype.ValueTypeName="string";ri.prototype.ValueBufferType=Array;ri.prototype.DefaultInterpolation=Zs;ri.prototype.InterpolantFactoryMethodLinear=void 0;ri.prototype.InterpolantFactoryMethodSmooth=void 0;aa=class extends nn{};aa.prototype.ValueTypeName="vector";la=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let m=c[u],g=c[u+1];if(m.global&&(m.lastIndex=0),m.test(h))return g}return null}}},c0=new la,ca=class{constructor(e){this.manager=e!==void 0?e:c0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};ca.DEFAULT_MATERIAL_NAME="__DEFAULT";ga="\\[\\]\\.:\\/",h0=new RegExp("["+ga+"]","g"),xa="[^"+ga+"]",u0="[^"+ga.replace("\\.","")+"]",d0=/((?:WC+[\/:])*)/.source.replace("WC",xa),f0=/(WCOD+)?/.source.replace("WCOD",u0),p0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",xa),m0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",xa),g0=new RegExp("^"+d0+f0+p0+m0+"$"),x0=["material","materials","bones","map"],ha=class{constructor(e,t,n){let s=n||Qe.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Qe=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(h0,"")}static parseTrackName(e){let t=g0.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);x0.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Qe.Composite=ha;Qe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Qe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Qe.prototype.GetterByBindingType=[Qe.prototype._getValue_direct,Qe.prototype._getValue_array,Qe.prototype._getValue_arrayElement,Qe.prototype._getValue_toArray];Qe.prototype.SetterByBindingTypeAndVersioning=[[Qe.prototype._setValue_direct,Qe.prototype._setValue_direct_setNeedsUpdate,Qe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_array,Qe.prototype._setValue_array_setNeedsUpdate,Qe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_arrayElement,Qe.prototype._setValue_arrayElement_setNeedsUpdate,Qe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_fromArray,Qe.prototype._setValue_fromArray_setNeedsUpdate,Qe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];gx=new Float32Array(1),_r=class{constructor(e,t,n=0,s=1/0){this.ray=new Ni(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new rs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,n=[]){return ua(e,this,n,t),n.sort(hc),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)ua(e[s],this,n,t);return n.sort(hc),n}};oi=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Mt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"160"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="160")});var Lc,_a,Dc,wr,Nc,y0,Tr,Uc=st(()=>{Er();Lc={type:"change"},_a={type:"start"},Dc={type:"end"},wr=new Ni,Nc=new Ft,y0=Math.cos(70*br.DEG2RAD),Tr=class extends an{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new L,this.cursor=new L,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:sn.ROTATE,MIDDLE:sn.DOLLY,RIGHT:sn.PAN},this.touches={ONE:cn.ROTATE,TWO:cn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(C){C.addEventListener("keydown",ee),this._domElementKeyEvents=C},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",ee),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(Lc),n.update(),r=s.NONE},this.update=(function(){let C=new L,$=new Ht().setFromUnitVectors(e.up,new L(0,1,0)),ae=$.clone().invert(),ie=new L,xe=new Ht,ze=new L,We=2*Math.PI;return function(oe=null){let P=n.object.position;C.copy(P).sub(n.target),C.applyQuaternion($),o.setFromVector3(C),n.autoRotate&&r===s.NONE&&F(M(oe)),n.enableDamping?(o.theta+=l.theta*n.dampingFactor,o.phi+=l.phi*n.dampingFactor):(o.theta+=l.theta,o.phi+=l.phi);let se=n.minAzimuthAngle,re=n.maxAzimuthAngle;isFinite(se)&&isFinite(re)&&(se<-Math.PI?se+=We:se>Math.PI&&(se-=We),re<-Math.PI?re+=We:re>Math.PI&&(re-=We),se<=re?o.theta=Math.max(se,Math.min(re,o.theta)):o.theta=o.theta>(se+re)/2?Math.max(se,o.theta):Math.min(re,o.theta)),o.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,o.phi)),o.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(h,n.dampingFactor):n.target.add(h),n.target.sub(n.cursor),n.target.clampLength(n.minTargetRadius,n.maxTargetRadius),n.target.add(n.cursor),n.zoomToCursor&&R||n.object.isOrthographicCamera?o.radius=W(o.radius):o.radius=W(o.radius*c),C.setFromSpherical(o),C.applyQuaternion(ae),P.copy(n.target).add(C),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,h.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),h.set(0,0,0));let be=!1;if(n.zoomToCursor&&R){let ye=null;if(n.object.isPerspectiveCamera){let Ye=C.length();ye=W(Ye*c);let qe=Ye-ye;n.object.position.addScaledVector(b,qe),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let Ye=new L(S.x,S.y,0);Ye.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),be=!0;let qe=new L(S.x,S.y,0);qe.unproject(n.object),n.object.position.sub(qe).add(Ye),n.object.updateMatrixWorld(),ye=C.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;ye!==null&&(this.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(ye).add(n.object.position):(wr.origin.copy(n.object.position),wr.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(wr.direction))<y0?e.lookAt(n.target):(Nc.setFromNormalAndCoplanarPoint(n.object.up,n.target),wr.intersectPlane(Nc,n.target))))}else n.object.isOrthographicCamera&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),be=!0);return c=1,R=!1,be||ie.distanceToSquared(n.object.position)>a||8*(1-xe.dot(n.object.quaternion))>a||ze.distanceToSquared(n.target)>0?(n.dispatchEvent(Lc),ie.copy(n.object.position),xe.copy(n.object.quaternion),ze.copy(n.target),!0):!1}})(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",fe),n.domElement.removeEventListener("pointerdown",Ie),n.domElement.removeEventListener("pointercancel",v),n.domElement.removeEventListener("wheel",J),n.domElement.removeEventListener("pointermove",A),n.domElement.removeEventListener("pointerup",v),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",ee),n._domElementKeyEvents=null)};let n=this,s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},r=s.NONE,a=1e-6,o=new oi,l=new oi,c=1,h=new L,u=new Te,d=new Te,m=new Te,g=new Te,x=new Te,f=new Te,p=new Te,y=new Te,_=new Te,b=new L,S=new Te,R=!1,w=[],N={};function M(C){return C!==null?2*Math.PI/60*n.autoRotateSpeed*C:2*Math.PI/60/60*n.autoRotateSpeed}function T(C){let $=Math.abs(C)/(100*(window.devicePixelRatio|0));return Math.pow(.95,n.zoomSpeed*$)}function F(C){l.theta-=C}function X(C){l.phi-=C}let j=(function(){let C=new L;return function(ae,ie){C.setFromMatrixColumn(ie,0),C.multiplyScalar(-ae),h.add(C)}})(),I=(function(){let C=new L;return function(ae,ie){n.screenSpacePanning===!0?C.setFromMatrixColumn(ie,1):(C.setFromMatrixColumn(ie,0),C.crossVectors(n.object.up,C)),C.multiplyScalar(ae),h.add(C)}})(),U=(function(){let C=new L;return function(ae,ie){let xe=n.domElement;if(n.object.isPerspectiveCamera){let ze=n.object.position;C.copy(ze).sub(n.target);let We=C.length();We*=Math.tan(n.object.fov/2*Math.PI/180),j(2*ae*We/xe.clientHeight,n.object.matrix),I(2*ie*We/xe.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(j(ae*(n.object.right-n.object.left)/n.object.zoom/xe.clientWidth,n.object.matrix),I(ie*(n.object.top-n.object.bottom)/n.object.zoom/xe.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}})();function G(C){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c/=C:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function Y(C){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c*=C:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function q(C,$){if(!n.zoomToCursor)return;R=!0;let ae=n.domElement.getBoundingClientRect(),ie=C-ae.left,xe=$-ae.top,ze=ae.width,We=ae.height;S.x=ie/ze*2-1,S.y=-(xe/We)*2+1,b.set(S.x,S.y,1).unproject(n.object).sub(n.object.position).normalize()}function W(C){return Math.max(n.minDistance,Math.min(n.maxDistance,C))}function Q(C){u.set(C.clientX,C.clientY)}function ne(C){q(C.clientX,C.clientX),p.set(C.clientX,C.clientY)}function ue(C){g.set(C.clientX,C.clientY)}function V(C){d.set(C.clientX,C.clientY),m.subVectors(d,u).multiplyScalar(n.rotateSpeed);let $=n.domElement;F(2*Math.PI*m.x/$.clientHeight),X(2*Math.PI*m.y/$.clientHeight),u.copy(d),n.update()}function Z(C){y.set(C.clientX,C.clientY),_.subVectors(y,p),_.y>0?G(T(_.y)):_.y<0&&Y(T(_.y)),p.copy(y),n.update()}function he(C){x.set(C.clientX,C.clientY),f.subVectors(x,g).multiplyScalar(n.panSpeed),U(f.x,f.y),g.copy(x),n.update()}function _e(C){q(C.clientX,C.clientY),C.deltaY<0?Y(T(C.deltaY)):C.deltaY>0&&G(T(C.deltaY)),n.update()}function ge(C){let $=!1;switch(C.code){case n.keys.UP:C.ctrlKey||C.metaKey||C.shiftKey?X(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(0,n.keyPanSpeed),$=!0;break;case n.keys.BOTTOM:C.ctrlKey||C.metaKey||C.shiftKey?X(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(0,-n.keyPanSpeed),$=!0;break;case n.keys.LEFT:C.ctrlKey||C.metaKey||C.shiftKey?F(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(n.keyPanSpeed,0),$=!0;break;case n.keys.RIGHT:C.ctrlKey||C.metaKey||C.shiftKey?F(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(-n.keyPanSpeed,0),$=!0;break}$&&(C.preventDefault(),n.update())}function Ce(C){if(w.length===1)u.set(C.pageX,C.pageY);else{let $=Ge(C),ae=.5*(C.pageX+$.x),ie=.5*(C.pageY+$.y);u.set(ae,ie)}}function Pe(C){if(w.length===1)g.set(C.pageX,C.pageY);else{let $=Ge(C),ae=.5*(C.pageX+$.x),ie=.5*(C.pageY+$.y);g.set(ae,ie)}}function Se(C){let $=Ge(C),ae=C.pageX-$.x,ie=C.pageY-$.y,xe=Math.sqrt(ae*ae+ie*ie);p.set(0,xe)}function Ve(C){n.enableZoom&&Se(C),n.enablePan&&Pe(C)}function O(C){n.enableZoom&&Se(C),n.enableRotate&&Ce(C)}function ut(C){if(w.length==1)d.set(C.pageX,C.pageY);else{let ae=Ge(C),ie=.5*(C.pageX+ae.x),xe=.5*(C.pageY+ae.y);d.set(ie,xe)}m.subVectors(d,u).multiplyScalar(n.rotateSpeed);let $=n.domElement;F(2*Math.PI*m.x/$.clientHeight),X(2*Math.PI*m.y/$.clientHeight),u.copy(d)}function Me(C){if(w.length===1)x.set(C.pageX,C.pageY);else{let $=Ge(C),ae=.5*(C.pageX+$.x),ie=.5*(C.pageY+$.y);x.set(ae,ie)}f.subVectors(x,g).multiplyScalar(n.panSpeed),U(f.x,f.y),g.copy(x)}function Ae(C){let $=Ge(C),ae=C.pageX-$.x,ie=C.pageY-$.y,xe=Math.sqrt(ae*ae+ie*ie);y.set(0,xe),_.set(0,Math.pow(y.y/p.y,n.zoomSpeed)),G(_.y),p.copy(y);let ze=(C.pageX+$.x)*.5,We=(C.pageY+$.y)*.5;q(ze,We)}function pe(C){n.enableZoom&&Ae(C),n.enablePan&&Me(C)}function Ke(C){n.enableZoom&&Ae(C),n.enableRotate&&ut(C)}function Ie(C){n.enabled!==!1&&(w.length===0&&(n.domElement.setPointerCapture(C.pointerId),n.domElement.addEventListener("pointermove",A),n.domElement.addEventListener("pointerup",v)),Ee(C),C.pointerType==="touch"?me(C):B(C))}function A(C){n.enabled!==!1&&(C.pointerType==="touch"?ce(C):te(C))}function v(C){De(C),w.length===0&&(n.domElement.releasePointerCapture(C.pointerId),n.domElement.removeEventListener("pointermove",A),n.domElement.removeEventListener("pointerup",v)),n.dispatchEvent(Dc),r=s.NONE}function B(C){let $;switch(C.button){case 0:$=n.mouseButtons.LEFT;break;case 1:$=n.mouseButtons.MIDDLE;break;case 2:$=n.mouseButtons.RIGHT;break;default:$=-1}switch($){case sn.DOLLY:if(n.enableZoom===!1)return;ne(C),r=s.DOLLY;break;case sn.ROTATE:if(C.ctrlKey||C.metaKey||C.shiftKey){if(n.enablePan===!1)return;ue(C),r=s.PAN}else{if(n.enableRotate===!1)return;Q(C),r=s.ROTATE}break;case sn.PAN:if(C.ctrlKey||C.metaKey||C.shiftKey){if(n.enableRotate===!1)return;Q(C),r=s.ROTATE}else{if(n.enablePan===!1)return;ue(C),r=s.PAN}break;default:r=s.NONE}r!==s.NONE&&n.dispatchEvent(_a)}function te(C){switch(r){case s.ROTATE:if(n.enableRotate===!1)return;V(C);break;case s.DOLLY:if(n.enableZoom===!1)return;Z(C);break;case s.PAN:if(n.enablePan===!1)return;he(C);break}}function J(C){n.enabled===!1||n.enableZoom===!1||r!==s.NONE||(C.preventDefault(),n.dispatchEvent(_a),_e(C),n.dispatchEvent(Dc))}function ee(C){n.enabled===!1||n.enablePan===!1||ge(C)}function me(C){switch(K(C),w.length){case 1:switch(n.touches.ONE){case cn.ROTATE:if(n.enableRotate===!1)return;Ce(C),r=s.TOUCH_ROTATE;break;case cn.PAN:if(n.enablePan===!1)return;Pe(C),r=s.TOUCH_PAN;break;default:r=s.NONE}break;case 2:switch(n.touches.TWO){case cn.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;Ve(C),r=s.TOUCH_DOLLY_PAN;break;case cn.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;O(C),r=s.TOUCH_DOLLY_ROTATE;break;default:r=s.NONE}break;default:r=s.NONE}r!==s.NONE&&n.dispatchEvent(_a)}function ce(C){switch(K(C),r){case s.TOUCH_ROTATE:if(n.enableRotate===!1)return;ut(C),n.update();break;case s.TOUCH_PAN:if(n.enablePan===!1)return;Me(C),n.update();break;case s.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;pe(C),n.update();break;case s.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Ke(C),n.update();break;default:r=s.NONE}}function fe(C){n.enabled!==!1&&C.preventDefault()}function Ee(C){w.push(C.pointerId)}function De(C){delete N[C.pointerId];for(let $=0;$<w.length;$++)if(w[$]==C.pointerId){w.splice($,1);return}}function K(C){let $=N[C.pointerId];$===void 0&&($=new Te,N[C.pointerId]=$),$.set(C.pageX,C.pageY)}function Ge(C){let $=C.pointerId===w[0]?w[1]:w[0];return N[$]}n.domElement.addEventListener("contextmenu",fe),n.domElement.addEventListener("pointerdown",Ie),n.domElement.addEventListener("pointercancel",v),n.domElement.addEventListener("wheel",J,{passive:!1}),this.update()}}});var Ar,Fc=st(()=>{Er();Uc();Ar=class extends Tr{constructor(e,t){super(e,t),this.screenSpacePanning=!1,this.mouseButtons={LEFT:sn.PAN,MIDDLE:sn.DOLLY,RIGHT:sn.ROTATE},this.touches={ONE:cn.PAN,TWO:cn.DOLLY_ROTATE}}}});var Rr=Ga(()=>{(function(i){"use strict";let n=Math.sqrt(7),s=Math.atan2(Math.sqrt(3)/2,5/2),r=[[0,0],[0,1],[1,0],[1,-1],[0,-1],[-1,0],[-1,1]];function a(b,S){return[2*b-S,b+3*S]}function o(b,S){let R=3*b+S,w=-b+2*S;if(R%7!==0||w%7!==0)throw new Error(`(${b},${S}) is not on the M lattice`);return[R/7,w/7]}function l(b,S,R){for(let w=0;w<R;w++){let N=a(b,S);b=N[0],S=N[1]}return[b,S]}let c=new Map;function h(b){if(c.has(b))return c.get(b);let S=new Int32Array([0,0]);for(let R=1;R<=b;R++){let w=S,N=w.length/2;S=new Int32Array(N*7*2);for(let M=0;M<7;M++){let[T,F]=l(r[M][0],r[M][1],R-1),X=M*N*2;for(let j=0;j<N;j++)S[X+j*2]=w[j*2]+T,S[X+j*2+1]=w[j*2+1]+F}c.set(R,S)}return c.set(b,S),S}function u(b,S){let R=(3*b+S)/7,w=(-b+2*S)/7,[N,M]=d(R,w);for(let T=0;T<7;T++){let F=N+r[T][0],X=M+r[T][1],[j,I]=a(F,X),U=b-j,G=S-I;for(let Y=0;Y<7;Y++)if(r[Y][0]===U&&r[Y][1]===G)return{q:j,r:I,child:Y,latQ:F,latR:X}}throw new Error(`parentOf(${b},${S}): no flower found (impossible)`)}function d(b,S){let R=b,w=S,N=-b-S,M=Math.round(R),T=Math.round(N),F=Math.round(w),X=Math.abs(M-R),j=Math.abs(T-N),I=Math.abs(F-w);return X>j&&X>I?M=-T-F:j>I?T=-M-F:F=-M-T,[M,F]}function m(b,S){return l(b,S,5)}function g(b,S){for(let R=0;R<5;R++){let w=o(b,S);b=w[0],S=w[1]}return[b,S]}function x(b,S){for(let R=0;R<5;R++){let w=u(b,S);b=w.latQ,S=w.latR}return[b,S]}function f(b,S){return[b*(Math.sqrt(3)/2)*6.4,S*6.4+b*.5*6.4]}function p(b){return 6.4*Math.pow(n,b)}function y(b){let S=Math.pow(n,b),R=b*s,w=Math.cos(R)*S,N=Math.sin(R)*S;return{a:w,b:N,c:-N,d:w}}let _=[1,7,49,343,2401,16807];i.GosperCore={UNIT_HEX_WIDTH_METERS:6.4,TILE_LEVEL:5,SQRT7:n,ROT_PER_LEVEL:s,NEIGHBORS:r,DEPTH_COUNTS:_,mulM:a,mulMInvExact:o,mulMPow:l,offsets:h,parentOf:u,latticeToCenter:m,centerToLattice:g,tileOfUnit:x,axialToWorld:f,levelSize:p,levelXZ:y}})(typeof self<"u"?self:globalThis)});function Oc(i,e){let t=window.GosperCore,n=b0,s=i/(Math.sqrt(3)/2*n),r=(e-s*.5*n)/n,a=s,o=r,l=-s-r,c=Math.round(a),h=Math.round(l),u=Math.round(o),d=Math.abs(c-a),m=Math.abs(h-l),g=Math.abs(u-o);d>m&&d>g?c=-h-u:m>g?h=-c-u:u=-c-h;let[x,f]=t.tileOfUnit(c,u);return{yq:x,yr:f}}async function hs(){return xt?!0:cs||(cs=(async()=>{try{let i=await fetch("assets/skigebiete.json");if(!i.ok)throw new Error(`HTTP ${i.status}`);let t=(await i.json()).ski_areas,n=t.find(u=>u.name==="Kappl"),s=t.find(u=>u.name==="St. Anton am Arlberg");if(!n||!s)throw new Error("projection reference points are missing");let r=s.gps.lon-n.gps.lon,a=s.gps.lat-n.gps.lat,o=s.epsg_31254.x-n.epsg_31254.x,l=s.epsg_31254.y-n.epsg_31254.y,c=o/r,h=l/a;return xt={scaleX:c,scaleY:h,refX:n.epsg_31254.x,refY:n.epsg_31254.y,refLon:n.gps.lon,refLat:n.gps.lat},console.log("Coordinate System Calibrated:",xt),!0}catch(i){return cs=null,console.error("Failed to init projection",i),!1}})(),cs)}function Cr(i,e){if(!xt)return{x:0,y:0};let t=(e-xt.refLon)*xt.scaleX,n=(i-xt.refLat)*xt.scaleY;return{x:xt.refX+t,y:xt.refY+n}}function Bc(i,e){return xt?{lat:xt.refLat+(e-xt.refY)/xt.scaleY,lon:xt.refLon+(i-xt.refX)/xt.scaleX}:null}var Ex,v0,M0,b0,xt,cs,ya=st(()=>{Ex=to(Rr()),v0=32,M0=.2,b0=v0*M0;xt=null,cs=null});var Pr,zc=st(()=>{ya();Pr=class{constructor(){this.peaks=[],this.skiAreas=[],this.loaded=!1,this.loadPromise=null,this.activeIndex=0,this.currentResults=[],this.injectStyles(),this.initUI()}injectStyles(){let e=document.createElement("style");e.textContent=`
            #hex-search-container {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 300px;
                z-index: 1000;
                font-family: 'Outfit', sans-serif;
            }
            .search-box {
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(116, 185, 255, 0.2);
                border-radius: 24px;
                display: flex;
                align-items: center;
                padding: 10px 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            .search-box:focus-within {
                border-color: #ff6b9d;
                box-shadow: 0 10px 40px rgba(255, 107, 157, 0.2);
            }
            .search-box svg {
                color: #74b9ff;
                margin-right: 10px;
            }
            #hex-search-input {
                background: transparent;
                border: none;
                color: #fff;
                font-family: inherit;
                font-size: 1rem;
                width: 100%;
                outline: none;
            }
            #hex-search-results {
                margin-top: 10px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(16px);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 400px;
                overflow-y: auto;
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
                transition: all 0.2s ease;
            }
            #hex-search-results.visible {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            .result-section {
                padding: 8px 15px;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #94a3b8;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .result-item {
                padding: 12px 15px;
                cursor: pointer;
                transition: background 0.1s;
                border-left: 2px solid transparent;
            }
            .result-item:hover, .result-item.active {
                background: rgba(116, 185, 255, 0.1);
                border-left-color: #74b9ff;
            }
            .result-item .name {
                display: block;
                color: #e2e8f0;
                font-weight: 600;
            }
            .result-item .meta {
                display: block;
                font-size: 0.8rem;
                color: #64748b;
                margin-top: 2px;
            }
            .result-item.unavailable {
                opacity: 0.46;
                cursor: not-allowed;
                filter: grayscale(0.85);
            }
            .result-item.unavailable:hover {
                background: transparent;
                border-left-color: transparent;
            }
            .result-item.unavailable .name {
                color: #94a3b8;
            }
            .result-item.unavailable .meta {
                color: #475569;
            }
            .result-item.empty,
            .result-item.loading {
                cursor: default;
            }
            .result-status {
                color: #f87171;
                font-size: 0.7rem;
                font-weight: 800;
                margin-left: 6px;
                text-transform: uppercase;
            }
            .result-item.ski {
                border-left-color: #ff6b9d; /* Pink for Ski */
            }
            
            @media (max-width: 768px) {
                #hex-search-container {
                    top: 10px;
                    right: 10px;
                    width: calc(100% - 20px);
                }
            }
        `,document.head.appendChild(e)}initUI(){let e=document.createElement("div");e.id="hex-search-container",e.innerHTML=`
            <div class="search-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="hex-search-input" placeholder="Search Peaks & Ski Areas..." autocomplete="off">
            </div>
            <div id="hex-search-results" class="hidden"></div>
        `,document.body.appendChild(e),this.input=document.getElementById("hex-search-input"),this.resultsBox=document.getElementById("hex-search-results"),this.input.addEventListener("focus",()=>{this.loadData().then(()=>this.handleInput({target:this.input})).catch(()=>{})}),this.input.addEventListener("input",t=>this.handleInput(t)),this.input.addEventListener("keydown",t=>this.handleKey(t)),document.addEventListener("click",t=>{e.contains(t.target)||this.resultsBox.classList.remove("visible")})}async loadData(){if(!this.loaded){if(this.loadPromise)return this.loadPromise;this.loadPromise=(async()=>{await hs();let[e,t]=await Promise.all([fetch("assets/tirol_peaks.geojson"),fetch("assets/skigebiete.json")]);if(!e.ok||!t.ok)throw new Error(`HTTP ${e.status}/${t.status}`);let n=await e.json(),s=await t.json();this.peaks=n.features.map(r=>({name:r.properties.name,ele:r.properties.ele,lat:r.geometry.coordinates[1],lon:r.geometry.coordinates[0],type:"peak"})).filter(r=>r.name),this.skiAreas=s.ski_areas.map(r=>({name:r.name,lat:r.gps.lat,lon:r.gps.lon,x:r.epsg_31254?.x,y:r.epsg_31254?.y,type:"ski"})),this.loaded=!0,console.log(`Loaded ${this.peaks.length} peaks and ${this.skiAreas.length} ski areas.`)})();try{return await this.loadPromise}catch(e){console.error("Search Data Load Error:",e),this.renderMessage("Search data unavailable.","empty")}finally{this.loadPromise=null}}}escapeHtml(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}renderMessage(e,t="empty"){this.resultsBox.innerHTML=`<div class="result-item ${t}"><span class="meta">${this.escapeHtml(e)}</span></div>`,this.resultsBox.classList.add("visible")}getWorldPosition(e){return Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:Cr(e.lat,e.lon)}getManifestTileKeys(e){return!e||!Array.isArray(e.tiles)?null:(this.manifestTileSource!==e&&(this.manifestTileSource=e,this.manifestTileKeys=new Set(e.tiles.map(t=>`${t.yq}_${t.yr}`))),this.manifestTileKeys)}getAvailability(e){let t=window.pistonViewer,n=t?.manifest;if(!n)return{available:!0,label:"",sectorKey:""};let s=this.getWorldPosition(e),r=Oc(s.x,s.y),a=`${r.yq}_${r.yr}`,o=t.manifestGrid||this.getManifestTileKeys(n);if(o?o.has(a):!1)return{available:!0,label:"",sectorKey:a};let c=n.bounds;return{available:!1,label:(c?s.x>=c.min_x&&s.x<=c.max_x&&s.y>=c.min_y&&s.y<=c.max_y:!1)?"No baked imagery":"Outside bake",sectorKey:a}}async handleInput(e){let t=e.target.value.toLowerCase().trim();if(t.length<2){this.resultsBox.classList.remove("visible"),this.currentResults=[],this.activeIndex=-1;return}if(!this.loaded){if(this.renderMessage("Loading search index...","loading"),await this.loadData(),this.input.value.toLowerCase().trim()!==t){this.handleInput({target:this.input});return}if(!this.loaded)return}let n=this.skiAreas.filter(a=>a.name.toLowerCase().includes(t)).slice(0,5).map(a=>({...a,category:"Ski Areas"})),s=this.peaks.filter(a=>a.name.toLowerCase().includes(t)).slice(0,10).map(a=>({...a,category:"Peaks"}));this.currentResults=[...n,...s].map(a=>({...a,availability:this.getAvailability(a)}));let r=this.currentResults.findIndex(a=>a.availability.available);this.activeIndex=r>=0?r:-1,this.renderResults()}renderResults(){if(this.currentResults.length===0){this.renderMessage("No matches found.","empty");return}let e="",t="";this.currentResults.forEach((n,s)=>{n.category!==t&&(e+=`<div class="result-section">${n.category}</div>`,t=n.category);let r=n.availability||this.getAvailability(n),a=s===this.activeIndex?"active":"",o=r.available?"":"unavailable",l=r.available?"":` <span class="result-status">${this.escapeHtml(r.label)}</span>`,c=n.type==="peak"?`${n.ele||"?"}m \u2022 Peak`:"Ski Resort",h=r.available?c:`${c} \u2022 ${r.sectorKey}`;e+=`
                <div class="result-item ${n.type} ${a} ${o}" data-idx="${s}">
                    <span class="name">${this.escapeHtml(n.name)}${l}</span>
                    <span class="meta">${this.escapeHtml(h)}</span>
                </div>
            `}),this.resultsBox.innerHTML=e,this.resultsBox.classList.add("visible"),this.resultsBox.querySelectorAll(".result-item[data-idx]").forEach(n=>{n.addEventListener("click",()=>{this.selectResult(parseInt(n.dataset.idx))})})}handleKey(e){this.resultsBox.classList.contains("visible")&&this.currentResults.length!==0&&(e.key==="ArrowDown"?(e.preventDefault(),this.moveActive(1),this.renderResults(),this.scrollToActive()):e.key==="ArrowUp"?(e.preventDefault(),this.moveActive(-1),this.renderResults(),this.scrollToActive()):e.key==="Enter"?(e.preventDefault(),this.activeIndex>=0&&this.selectResult(this.activeIndex)):e.key==="Escape"&&(this.resultsBox.classList.remove("visible"),this.input.blur()))}moveActive(e){if(!this.currentResults.some(s=>s.availability?.available!==!1))return;let t=this.currentResults.length,n=this.activeIndex>=0?this.activeIndex:e>0?-1:0;for(let s=0;s<t;s++)if(n=(n+e+t)%t,this.currentResults[n].availability?.available!==!1){this.activeIndex=n;return}}scrollToActive(){let e=this.resultsBox.querySelector(".result-item.active");e&&e.scrollIntoView({block:"nearest"})}selectResult(e){if(!this.currentResults[e])return;let t=this.currentResults[e],n=t.availability||this.getAvailability(t);if(!n.available){console.log(`Blocked navigation to ${t.name} - ${n.label}.`),window.pistonViewer?.log&&window.pistonViewer.log(`"${t.name}" has no baked imagery in this map.`,"info");return}let s=this.getWorldPosition(t);if(console.log(`Zooming to ${t.name}:`,s),window.pistonViewer){let r=window.pistonViewer;if(r.worldOrigin){let a=s.x-r.worldOrigin.x,o=-(s.y-r.worldOrigin.y);r.controls.target.set(a,0,o),r.camera.position.set(a,1500,o+1e3),r.notifyCameraMotion(performance.now()),r.controls.update(),r.needsRender=!0,r.needsLODUpdate=!0,r.updateLOD()}}this.resultsBox.classList.remove("visible"),this.input.value=t.name}}});var Ir,Hc=st(()=>{Ir=class{constructor(){this.entries=new Map,this.textureEntries=new Map,this.totalGeometryBytes=0,this.totalTextureBytes=0,this.totalNetworkBytes=0,this._networkBin=0,this._networkTex=0}get totalVRAMBytes(){return this.totalGeometryBytes+this.totalTextureBytes}registerGeometry(e,t){this.deregisterGeometry(e);let n={geometryBytes:t.geometryBytes||0,q:t.q,r:t.r,lx:t.lx,lz:t.lz};this.entries.set(e,n),this.totalGeometryBytes+=n.geometryBytes}deregisterGeometry(e){let t=this.entries.get(e);t&&(this.totalGeometryBytes-=t.geometryBytes,this.entries.delete(e))}setTexture(e,t,n,s=null){let r=`${e}:${t}`;this.removeTexture(e,t);let a=this.entries.get(e),o=s||a||{};this.textureEntries.set(r,{key:e,tier:t,bytes:n||0,kind:o.kind||"texture",q:o.q,r:o.r,pageX:o.pageX,pageY:o.pageY,lx:o.lx,lz:o.lz,bounds:o.bounds||null}),this.totalTextureBytes+=n||0}removeTexture(e,t){let n=`${e}:${t}`,s=this.textureEntries.get(n);s&&(this.totalTextureBytes-=s.bytes,this.textureEntries.delete(n))}updateTextureLocation(e,t){if(t)for(let n of this.textureEntries.values())n.key===e&&(n.kind=t.kind||n.kind,n.q=t.q,n.r=t.r,n.pageX=t.pageX,n.pageY=t.pageY,n.lx=t.lx,n.lz=t.lz,n.bounds=t.bounds||null)}textureBytesFor(e){let t=0;for(let n of this.textureEntries.values())n.key===e&&(t+=n.bytes);return t}addNetworkPayload(e,t){t?.bin&&(this._networkBin+=t.bin,this.totalNetworkBytes+=t.bin),t?.tex&&(this._networkTex+=t.tex,this.totalNetworkBytes+=t.tex)}getSpatialBreakdown(e,t,n){let s={inFrustumBytes:0,outFrustumBytes:0,nearBytes:0,midBytes:0,farBytes:0,tileBreakdown:{inFrustum:0,outFrustum:0},texturePageBreakdown:{inFrustum:0,outFrustum:0,inFrustumAllocations:0,outFrustumAllocations:0},geometryBytes:this.totalGeometryBytes,textureBytes:this.totalTextureBytes};for(let[o,l]of this.entries){let c=n?.get(o),h=l.geometryBytes;!c?.bounds||!e||e.intersectsBox(c.bounds)?(s.inFrustumBytes+=h,s.tileBreakdown.inFrustum++):(s.outFrustumBytes+=h,s.tileBreakdown.outFrustum++);let d=(l.lx||0)-t.x,m=(l.lz||0)-t.z,g=Math.hypot(d,t.y,m);g<2e3?s.nearBytes+=h:g<5e3?s.midBytes+=h:s.farBytes+=h}let r=new Set,a=new Set;for(let o of this.textureEntries.values()){!o.bounds||!e||e.intersectsBox(o.bounds)?(s.inFrustumBytes+=o.bytes,s.texturePageBreakdown.inFrustumAllocations++,r.add(o.key)):(s.outFrustumBytes+=o.bytes,s.texturePageBreakdown.outFrustumAllocations++,a.add(o.key));let c=(o.lx||0)-t.x,h=(o.lz||0)-t.z,u=Math.hypot(c,t.y,h);u<2e3?s.nearBytes+=o.bytes:u<5e3?s.midBytes+=o.bytes:s.farBytes+=o.bytes}return s.texturePageBreakdown.inFrustum=r.size,s.texturePageBreakdown.outFrustum=a.size,s}static formatBytes(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(1)} MB`}}});var Lr,kc=st(()=>{Lr=class{constructor(e=268435456){this.budget=e,this.highEntries=new Map,this.highBytes=0,this.evictionCount=0,this.evictedBytes=0,this.redownloadCount=0,this.evictedHistory=new Set}get utilization(){return this.budget>0?this.highBytes/this.budget:1}get headroom(){return Math.max(0,this.budget-this.highBytes)}touch(e,t=performance.now()){let n=this.highEntries.get(e);n&&(n.lastUsed=t)}updatePriority(e,t){let n=this.highEntries.get(e);n&&(n.priority=Number.isFinite(t)?t:0)}admitHigh(e,t,n,s=new Set,r=0,a=()=>!0){if(t>this.budget)return!1;let o=Number.isFinite(r)?r:0,l=this.highEntries.get(e),c=l?.bytes||0,h=this.highBytes-c+t,u=Array.from(this.highEntries.entries()).filter(([m])=>m!==e&&!s.has(m)&&a(m)).sort((m,g)=>m[1].priority-g[1].priority||m[1].lastUsed-g[1].lastUsed),d=[];for(let[m,g]of u){if(h<=this.budget)break;if(g.priority>o)return!1;d.push([m,g]),h-=g.bytes}if(h>this.budget)return!1;for(let[m,g]of d){if(n(m)===!1)throw new Error(`preflighted high-texture eviction failed for ${m}`);this.removeHigh(m),this.evictionCount++,this.evictedBytes+=g.bytes,this.evictedHistory.add(m)}return l&&(this.highBytes-=l.bytes),this.highEntries.set(e,{bytes:t,lastUsed:performance.now(),priority:o}),this.highBytes+=t,this.evictedHistory.has(e)&&this.redownloadCount++,!0}removeHigh(e){let t=this.highEntries.get(e);t&&(this.highEntries.delete(e),this.highBytes-=t.bytes)}}});function va(i,e){let t=i.length;if(t===0)return 0;let n=Math.min(t-1,Math.max(0,Math.floor(e*t)));return i[n]}function On(i,e=2){let t=10**e;return Math.round(i*t)/t}var Vc,S0,Dr,Gc=st(()=>{Vc="hexagons:perfProfiler:lastRun",S0=["MOVING_2D","MOVING_3D","SINTERING","STATIC"];Dr=class{constructor(e){this.viewer=e,this.startTime=performance.now(),this.runId=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,this.frames={total:0,rendered:0,skipped:0},this._active=[],this._lastFrameTime=null,this._lastPersist=performance.now(),this.samples=[],this.milestones={},this.memory={jsHeapPeakBytes:0,jsHeapEndBytes:0,contextLostCount:0,glOutOfMemoryCount:0},this.vram={peakLedgerBytes:0,endLedgerBytes:0,budgetBytes:0,peakUtilization:0},this.cache={evictions:0,evictedBytes:0,redownloads:0},this.textures={upgrades:0,texStats:null},this.meta={scenario:null,texturePipeline:null,appVersion:null,timestamp:new Date().toISOString(),userAgent:typeof navigator<"u"&&navigator.userAgent||"unknown",duration_s:0,crashed:!1,finished:!1,runId:this.runId},this._recovered=this._checkRecovery(),this._attachContextLostListener(),this._samplerHandle=setInterval(()=>this._sample(),1e3),this._persist()}_checkRecovery(){try{let e=localStorage.getItem(Vc);if(!e)return null;let t=JSON.parse(e);if(t&&t.meta&&t.meta.finished===!1)return t.meta.crashed=!0,console.log(`[PERF_RECOVERY] Found an unfinalized perf run from a previous session (scenario=${t.meta.scenario}, runId=${t.meta.runId}). Call pistonViewer.profiler.recoverLastRun() to retrieve it.`),t}catch(e){console.warn("[PERF_PROFILER] Failed to parse recovered run from localStorage:",e)}return null}recoverLastRun(){return this._recovered}_attachContextLostListener(){let e=this.viewer?.renderer?.domElement;e&&e.addEventListener("webglcontextlost",t=>{this.memory.contextLostCount++,this.meta.crashed=!0,console.error("[PERF_OOM] webglcontextlost fired \u2014 GPU context lost (likely OOM). Persisting immediately."),this._persist()})}_pollGlError(){try{let e=this.viewer?.renderer?.getContext?.();if(!e)return;let t,n=0;for(;(t=e.getError())!==e.NO_ERROR&&n++<10;)t===e.OUT_OF_MEMORY&&(this.memory.glOutOfMemoryCount++,console.warn("[PERF_OOM] gl.getError() reported OUT_OF_MEMORY (0x0505)"))}catch{}}frame(e,t,n){if(this.frames.total++,n?this.frames.rendered++:this.frames.skipped++,this._lastFrameTime!==null){let s=e-this._lastFrameTime;(n||t!=="STATIC")&&s>=0&&Number.isFinite(s)&&this._active.push({dt:s,state:t})}this._lastFrameTime=e,e-this._lastPersist>2e3&&(this._lastPersist=e,this._persist())}_sample(){let e=this.viewer,t=(performance.now()-this.startTime)/1e3,n={t:On(t,1)};if(typeof performance<"u"&&performance.memory){let s=performance.memory;n.jsHeap={used:s.usedJSHeapSize,total:s.totalJSHeapSize,limit:s.jsHeapSizeLimit},this.memory.jsHeapPeakBytes=Math.max(this.memory.jsHeapPeakBytes,s.usedJSHeapSize),this.memory.jsHeapEndBytes=s.usedJSHeapSize}if(e?.renderer?.info){let s=e.renderer.info;n.renderInfo={calls:s.render?.calls,triangles:s.render?.triangles,geometries:s.memory?.geometries,textures:s.memory?.textures,programs:s.programs?.length}}if(typeof e?.getDetailedStats=="function")try{let s=e.getDetailedStats("profiler-sample");n.vram={totalBytes:s.vram.totalBytes,highTextureBudgetBytes:s.vram.highTextureBudgetBytes,highTextureBudgetUtilization:s.vram.highTextureBudgetUtilization},n.tiles={loaded:s.tiles.loaded,loadQueue:s.tiles.loadQueue,textureQueue:s.tiles.textureQueue,textureResultQueue:s.tiles.textureResultQueue,geometryRebuildQueue:s.tiles.geometryRebuildQueue,activeWorkers:s.tiles.activeWorkers},this.vram.peakLedgerBytes=Math.max(this.vram.peakLedgerBytes,s.vram.totalBytes),this.vram.endLedgerBytes=s.vram.totalBytes,this.vram.budgetBytes=s.vram.highTextureBudgetBytes,this.vram.peakUtilization=Math.max(this.vram.peakUtilization,s.vram.highTextureBudgetUtilization)}catch{}if(e?.cacheManager&&(n.cache={evictions:e.cacheManager.evictionCount,evictedBytes:e.cacheManager.evictedBytes,redownloads:e.cacheManager.redownloadCount},this.cache.evictions=e.cacheManager.evictionCount,this.cache.evictedBytes=e.cacheManager.evictedBytes,this.cache.redownloads=e.cacheManager.redownloadCount),e&&e.texStats)try{n.texStats=JSON.parse(JSON.stringify(e.texStats)),this.textures.texStats=n.texStats,typeof e.texStats.upgrades=="number"&&(this.textures.upgrades=e.texStats.upgrades)}catch{}this._pollGlError(),n.glOutOfMemoryCount=this.memory.glOutOfMemoryCount,this.samples.push(n),this._persist()}_computeFrameStats(e){let t=e.map(a=>a.dt).sort((a,o)=>a-o),n=t.length,s=t.reduce((a,o)=>a+o,0),r=n?s/n:0;return{count:n,fps_avg:n&&r>0?On(1e3/r,1):0,p50_ms:On(va(t,.5)),p95_ms:On(va(t,.95)),p99_ms:On(va(t,.99)),worst_ms:On(n?t[n-1]:0),over20:t.filter(a=>a>20).length,over33:t.filter(a=>a>33).length,over100:t.filter(a=>a>100).length}}setMeta(e){Object.assign(this.meta,e)}milestone(e){try{if(!e||Object.hasOwn(this.milestones,e))return;this.milestones[e]=On(performance.now()-this.startTime,1)}catch{}}getReport(){this.meta.duration_s=On((performance.now()-this.startTime)/1e3,1);let e=this._computeFrameStats(this._active),t={};for(let n of S0){let s=this._active.filter(r=>r.state===n);s.length&&(t[n]=this._computeFrameStats(s))}return{meta:{...this.meta},frames:{total:this.frames.total,rendered:this.frames.rendered,skipped:this.frames.skipped,fps_avg_active:e.fps_avg,p50_ms:e.p50_ms,p95_ms:e.p95_ms,p99_ms:e.p99_ms,worst_ms:e.worst_ms,over20:e.over20,over33:e.over33,over100:e.over100,perState:t},memory:{...this.memory},vram:{...this.vram},cache:{...this.cache},textures:{...this.textures},milestones:{...this.milestones},samples:this.samples}}finalize(e={}){Object.assign(this.meta,e,{finished:!0});let t=this.getReport();return console.log("[PERF_REPORT] "+JSON.stringify(t)),this._persistReport(t),t}downloadReport(e){let t=e||this.getReport();try{let n=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),s=URL.createObjectURL(n),r=document.createElement("a"),a=t.meta?.scenario||"manual",o=t.meta?.texturePipeline||"unknown";r.href=s,r.download=`perf_${o}_${a}_${Date.now()}.json`,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),2e3)}catch(n){console.warn("[PERF_PROFILER] downloadReport failed:",n)}}_persist(){this._persistReport(this.getReport())}_persistReport(e){try{localStorage.setItem(Vc,JSON.stringify(e))}catch(t){console.warn("[PERF_PROFILER] localStorage persist failed (quota? private mode?):",t)}}dispose(){this._samplerHandle&&clearInterval(this._samplerHandle)}}});function Bn(i,e,t){return i+(e-i)*t}function Ur(i){return Math.max(0,Math.min(1,i))}function E0(i,e,t){return Math.max(e,Math.min(t,i))}function Ma(i){let e=Ur(i);return e*e*(3-2*e)}function Fr(i,e,t,n){return{x:i.x+e*Math.sin(n)*Math.sin(t),y:i.y+e*Math.cos(n),z:i.z+e*Math.sin(n)*Math.cos(t)}}function w0(i,e){let t=i.x-e.x,n=i.y-e.y,s=i.z-e.z,r=Math.sqrt(t*t+n*n+s*s),a=r>1e-6?Math.acos(E0(n/r,-1,1)):0,o=Math.atan2(t,s);return{radius:r,phi:a,theta:o}}function Nr(i,e){let t=Math.min(i.length-1,Math.max(0,Math.floor(e*i.length)));return i[t]}function T0(i){let e=i.bounds,t=i?.tiles;if(!t||t.length<20)return{minX:0,maxX:e.max_x-e.min_x,minZ:-(e.max_y-e.min_y),maxZ:0};let n=t.map(c=>c.x).sort((c,h)=>c-h),s=t.map(c=>c.y).sort((c,h)=>c-h),r=Nr(n,.02),a=Nr(n,.98),o=Nr(s,.02),l=Nr(s,.98);return{minX:r-e.min_x,maxX:a-e.min_x,minZ:-(l-e.min_y),maxZ:-(o-e.min_y)}}function A0(i){let e=i?.bounds,t=i?.tiles;return!e||!t?[]:t.filter(n=>Number.isFinite(n.hMax)).map(n=>({x:n.x-e.min_x,z:-(n.y-e.min_y),hMax:n.hMax}))}function R0(i,e,t,n){if(i.length===0)return null;let s=n*n,r=-1/0,a=-1/0;for(let o of i){o.hMax>a&&(a=o.hMax);let l=o.x-e,c=o.z-t;l*l+c*c<=s&&o.hMax>r&&(r=o.hMax)}return r>-1/0?r:a}function C0(i){let e=[{x:i.controls.target.x,z:i.controls.target.z}],t=i.manifest,n=t?.tiles;if(n&&n.length>4&&t.bounds){let s=[...n].sort((a,o)=>a.x-o.x||a.y-o.y),r=t.bounds;for(let a of[.15,.4,.6,.85]){let o=Math.min(s.length-1,Math.floor(a*(s.length-1))),l=s[o];e.push({x:l.x-r.min_x,z:-(l.y-r.min_y)})}}return e}function P0(i,e){if(i<5)return{camPos:e.startPos,target:e.pivot};if(i<15){let c=Ma((i-5)/10);return{camPos:Fr(e.pivot,Bn(e.initialRadius,2e3,c),e.initialTheta,Bn(e.initialPhi,1.2,c)),target:e.pivot}}let a=i-5-10,o=Math.max(1,e.totalDuration-5-10),l=e.initialTheta+a/o*Math.PI*2;return{camPos:Fr(e.pivot,2e3,l,1.2),target:e.pivot}}function I0(i,e){let{minX:t,maxX:n,minZ:s,maxZ:r}=e.localBounds,a=6,o=(r-s)/a,c=Ur(i/e.totalDuration)*a,h=Math.min(a-1,Math.floor(c)),u=Ur(c-h),d=s+o*(h+.5),g={x:h%2===0?Bn(t,n,u):Bn(n,t,u),y:0,z:d};return{camPos:Fr(g,1300,0,.35),target:g}}function L0(i,e){let t=e.locations,n=t.length,s=e.totalDuration/n,r=Math.min(n-1,Math.floor(i/s)),a=Ur((i-r*s)/s),o=t[r],l={x:o.x,y:0,z:o.z},c=15e3,h=300,u=.3,d=1,m,g,x;if(a<.05)m=c,g=u,x=0;else if(a<.45){let f=Ma((a-.05)/.4);m=Bn(c,h,f),g=Bn(u,d,f),x=0}else if(a<.75){let f=(a-.45)/.3;m=h,g=d,x=f*Math.PI*1.5}else{let f=Ma((a-.75)/.25);m=Bn(h,c,f),g=Bn(d,u,f),x=Math.PI*1.5}return{camPos:Fr(l,m,x,g),target:l}}function Xc(){let i=document.createElement("div");return i.id="bench-hud",i.style.cssText=["position:fixed","top:12px","left:50%","transform:translateX(-50%)","background:rgba(10,10,10,0.75)","color:#fff","font:12px/1.4 'Courier New',monospace","padding:8px 16px","border-radius:8px","border:1px solid rgba(255,255,255,0.15)","z-index:9999","pointer-events:none","text-align:center","white-space:pre"].join(";"),document.body.appendChild(i),i}function ba(i,e,t,n,s=!1){if(!i)return;let r=Math.min(100,t/n*100).toFixed(0);i.textContent=s?`[BENCHMARK] ${e} \u2014 DONE (${n.toFixed(0)}s)`:`[BENCHMARK] ${e} \u2014 ${t.toFixed(1)}s / ${n.toFixed(0)}s (${r}%)`}function D0(i,e=45e3){return new Promise((t,n)=>{let s=performance.now(),r=()=>{if(i.loaderHidden&&i.manifest)return t();if(performance.now()-s>e)return n(new Error("Timed out waiting for viewer readiness (loaderHidden/manifest never became available)"));requestAnimationFrame(r)};r()})}function Yc(i,e,t,n,s){ba(e,t,n,n,!0),console.log(`[BENCHMARK] Scenario "${t}" complete.`);let r="ktx2";if(i.profiler){let a=i.profiler.finalize({scenario:t,texturePipeline:r,appVersion:s||null,timestamp:new Date().toISOString(),userAgent:navigator.userAgent});i.profiler.downloadReport(a)}else console.error("[BENCHMARK] viewer.profiler not found \u2014 cannot finalize/download the perf report.");setTimeout(()=>e?.remove(),5e3)}function N0(i,e,t,n){let s=Xc(),r=performance.now(),a=()=>{let o=(performance.now()-r)/1e3;if(i.profiler?.milestones?.visibleTexturedCoverage!==void 0||o>=t.duration){Yc(i,s,e,t.duration,n);return}ba(s,e,o,t.duration),setTimeout(a,250)};console.log(`[BENCHMARK] Starting scenario "${e}" (${t.duration}s)...`),a()}function U0(i,e,t,n){let s=Xc(),r=i.camera.position.clone(),a=i.controls.target.clone(),o=w0(r,a),l={startPos:r,startTarget:a,pivot:a.clone(),initialTheta:o.theta,initialPhi:o.phi,initialRadius:o.radius,localBounds:T0(i.manifest),totalDuration:t.duration,heightLookup:A0(i.manifest)};e==="stress"&&(l.locations=C0(i));let c=performance.now(),h=()=>Yc(i,s,e,t.duration,n),u=()=>{let d=(performance.now()-c)/1e3;if(d>=t.duration){h();return}let{camPos:m,target:g}=t.fn(d,l),x=R0(l.heightLookup,m.x,m.z,1500);if(x!==null){let f=(x-i.floorState.value)*1+80;m.y<f&&(m.y=f)}i.camera.position.set(m.x,m.y,m.z),i.controls.target.set(g.x,g.y,g.z),i.notifyCameraMotion(performance.now()),i.controls.update(),i.needsRender=!0,i.needsLODUpdate=!0,ba(s,e,d,t.duration),requestAnimationFrame(u)};console.log(`[BENCHMARK] Starting scenario "${e}" (${t.duration}s)...`),u()}function qc(i,e){let t=new URLSearchParams(window.location.search).get("bench");if(!t)return;let n=Wc[t];if(!n){console.error(`[BENCHMARK] Unknown scenario "${t}". Valid options: ${Object.keys(Wc).join(", ")}`);return}console.log(`[BENCHMARK] Scenario "${t}" queued \u2014 waiting for the viewer's initial tile load...`),D0(i).then(()=>{n.holdStill?N0(i,t,n,e):U0(i,t,n,e)}).catch(s=>console.error("[BENCHMARK] "+s.message))}var Wc,$c=st(()=>{Wc={coldload:{duration:45,fn:null,holdStill:!0},orbit:{duration:60,fn:P0},traverse:{duration:90,fn:I0},stress:{duration:120,fn:L0}}});function Kc(i){if(!i)return null;let e=i.split(",");if(e.length!==3)return null;let[t,n,s]=e.map(Number);return![t,n,s].every(Number.isFinite)||t<-90||t>90||n<-180||n>180||Math.abs(s)>1e5?null:{lat:t,lon:n,sceneY:s}}function Jc(i){return`${i.lat.toFixed(8)},${i.lon.toFixed(8)},${i.sceneY.toFixed(3)}`}function Yt(i,e=3){let t=10**e;return Math.round(i*t)/t}var Zc,F0,Or,jc=st(()=>{ya();Zc="1",F0=450;Or=class{constructor(e){this.viewer=e,this.writeTimer=null,this.userGestureChanged=!1,e.controls.addEventListener("start",()=>{this.userGestureChanged=!1,clearTimeout(this.writeTimer)}),e.controls.addEventListener("change",()=>{e.isUserInteracting&&(this.userGestureChanged=!0)}),e.controls.addEventListener("end",()=>{this.userGestureChanged&&(clearTimeout(this.writeTimer),this.writeTimer=setTimeout(()=>{e.isUserInteracting||this.replaceUrl()},F0))});let t=document.getElementById("copy-view-link");t?.addEventListener("click",async()=>{let n=this.replaceUrl(),s=!1;try{await navigator.clipboard.writeText(n),s=!0}catch{}t.textContent=s?"COPIED":"URL UPDATED",setTimeout(()=>{t.textContent="COPY LINK"},1400)}),window.hexView={getState:()=>this.getState(),getUrl:()=>this.buildUrl().href,copyLink:()=>this.copyLink(),applyUrl:n=>this.applyUrl(n)}}sceneToGps(e){let t=e.x+this.viewer.worldOrigin.x,n=this.viewer.worldOrigin.y-e.z,s=Bc(t,n);return s?{...s,sceneY:e.y}:null}gpsToScene(e){let t=Cr(e.lat,e.lon);return{x:t.x-this.viewer.worldOrigin.x,y:e.sceneY,z:-(t.y-this.viewer.worldOrigin.y)}}getState(){let e=this.sceneToGps(this.viewer.camera.position),t=this.sceneToGps(this.viewer.controls.target);if(!e||!t)return null;let n=this.viewer.camera.position.x-this.viewer.controls.target.x,s=this.viewer.camera.position.y-this.viewer.controls.target.y,r=this.viewer.camera.position.z-this.viewer.controls.target.z,a=Math.hypot(n,r),o=Math.min(1,Math.max(0,(this.viewer.controls.getPolarAngle()*180/Math.PI-5.5)/(25-5.5))),l=this.viewer.floorState?.value,c=o>.001&&Number.isFinite(l)?l+this.viewer.camera.position.y/o:null;return{schema:1,target:{lat:Yt(t.lat,8),lon:Yt(t.lon,8),sceneY_m:Yt(t.sceneY)},camera:{lat:Yt(e.lat,8),lon:Yt(e.lon,8),sceneY_m:Yt(e.sceneY)},orientation:{bearing_deg:Yt((Math.atan2(n,-r)*180/Math.PI+360)%360,2),pitch_deg:Yt(Math.atan2(s,a)*180/Math.PI,2),range_m:Yt(Math.hypot(a,s),2)},vertical:{datum:"dynamic-view-floor",floor_source_elevation_m:Number.isFinite(l)?Yt(l,1):null,terrain_height_morph:Yt(o,4),camera_source_elevation_estimate_m:c===null?null:Yt(c,1),note:"URL sceneY values are renderer-scene meters, not absolute MSL elevations."}}}buildUrl(){let e=this.getState(),t=new URL(window.location.href);return e&&(t.searchParams.set("view",Zc),t.searchParams.set("at",Jc({lat:e.target.lat,lon:e.target.lon,sceneY:e.target.sceneY_m})),t.searchParams.set("eye",Jc({lat:e.camera.lat,lon:e.camera.lon,sceneY:e.camera.sceneY_m}))),t}replaceUrl(){let e=this.buildUrl();return e.href!==window.location.href&&history.replaceState(history.state,"",e),e.href}async copyLink(){let e=this.replaceUrl();return await navigator.clipboard.writeText(e),e}async applyUrl(e=window.location.href){let t;try{t=e.startsWith?.("?")?new URL(e,window.location.href):new URL(e,window.location.href)}catch{return!1}if(t.searchParams.get("view")!==Zc)return!1;let n=Kc(t.searchParams.get("at")),s=Kc(t.searchParams.get("eye"));if(!n||!s||!await hs())return!1;let r=this.gpsToScene(n),a=this.gpsToScene(s),o=Math.hypot(a.x-r.x,a.y-r.y,a.z-r.z);if(!Number.isFinite(o)||o<1||o>1e5)return!1;this.viewer.bootstrapVisibilityFloor?.(r),this.viewer.controls.target.set(r.x,r.y,r.z),this.viewer.camera.position.set(a.x,a.y,a.z);let l=performance.now();return this.viewer.notifyCameraMotion(l),this.viewer.controls.update(),this.viewer.syncHeightFactorFromControls?.(),this.viewer.lastLODCamPos.copy(this.viewer.camera.position),this.viewer.needsLODUpdate=!0,this.viewer.needsRender=!0,!0}async restoreFromUrl(){let e=new URLSearchParams(window.location.search);if(!e.has("view")&&!e.has("at")&&!e.has("eye"))return await hs(),!1;let t=await this.applyUrl(window.location.href);return t||this.viewer.log("Invalid shareable view URL; using the default start.","warn"),t}}});function Ct(i,e){if(!Number.isFinite(i))throw new TypeError(`${e} must be finite`);return i}function B0(i){let e=i?.elements??i;if(!e||e.length!==16)throw new TypeError("viewProjection must be a 16-element column-major matrix");return e}function zr(i,e="frustum"){if(!i||i.length!==Br*Sa)throw new TypeError(`${e} must contain six vec4 planes`);return i}function ki(i,e,t,n,s,r){let a=Math.hypot(t,n,s);if(!(a>0)||!Number.isFinite(a))throw new RangeError("frustum contains a degenerate plane");let o=1/a;i[e]=t*o,i[e+1]=n*o,i[e+2]=s*o,i[e+3]=r*o}function eh(i,e=new Float64Array(24)){let t=B0(i);if(!e||e.length!==24)throw new TypeError("out must contain 24 numbers");return ki(e,0,t[3]-t[0],t[7]-t[4],t[11]-t[8],t[15]-t[12]),ki(e,4,t[3]+t[0],t[7]+t[4],t[11]+t[8],t[15]+t[12]),ki(e,8,t[3]+t[1],t[7]+t[5],t[11]+t[9],t[15]+t[13]),ki(e,12,t[3]-t[1],t[7]-t[5],t[11]-t[9],t[15]-t[13]),ki(e,16,t[3]-t[2],t[7]-t[6],t[11]-t[10],t[15]-t[14]),ki(e,20,t[3]+t[2],t[7]+t[6],t[11]+t[10],t[15]+t[14]),e}function th(i,{marginMeters:e=0,planeMargins:t=null,predictedTranslation:n=null}={},s=new Float64Array(24)){let r=zr(i,"source");if(!s||s.length!==24)throw new TypeError("out must contain 24 numbers");if(Ct(e,"marginMeters"),e<0)throw new RangeError("marginMeters cannot be negative");if(t&&t.length!==Br)throw new TypeError("planeMargins must contain six metre values");let a=n??[0,0,0];if(a.length!==3)throw new TypeError("predictedTranslation must be a vec3");let o=Ct(Number(a[0]),"predictedTranslation.x"),l=Ct(Number(a[1]),"predictedTranslation.y"),c=Ct(Number(a[2]),"predictedTranslation.z");for(let h=0;h<Br;h++){let u=h*Sa,d=r[u],m=r[u+1],g=r[u+2],x=Math.hypot(d,m,g);if(!(x>0))throw new RangeError("source contains a degenerate plane");let f=1/x,p=d*f,y=m*f,_=g*f,b=r[u+3]*f,S=t?Ct(Number(t[h]),`planeMargins[${h}]`):0;if(S<0)throw new RangeError("planeMargins cannot be negative");let R=Math.max(0,-(p*o+y*l+_*c));s[u]=p,s[u+1]=y,s[u+2]=_,s[u+3]=b+e+S+R}return s}function Qc(i,e,t=0){let n=zr(i);if(!e||e.length!==O0)throw new TypeError("bounds must be [minX,minY,minZ,maxX,maxY,maxZ]");let s=!0;for(let r=0;r<Br;r++){let a=r*Sa,o=n[a],l=n[a+1],c=n[a+2],h=n[a+3],u=o>=0?e[3]:e[0],d=l>=0?e[4]:e[1],m=c>=0?e[5]:e[2];if(o*u+l*d+c*m+h<-t)return zn.OUTSIDE;let g=o>=0?e[0]:e[3],x=l>=0?e[1]:e[4],f=c>=0?e[2]:e[5];o*g+l*x+c*f+h<t&&(s=!1)}return s?zn.INSIDE:zn.INTERSECT}function nh({position:i,forward:e,verticalFovRadians:t,viewportHeightPx:n,near:s=.1}){if(!i||i.length!==3)throw new TypeError("position must be a vec3");if(!e||e.length!==3)throw new TypeError("forward must be a vec3");let r=Ct(Number(i[0]),"position.x"),a=Ct(Number(i[1]),"position.y"),o=Ct(Number(i[2]),"position.z"),l=Ct(Number(e[0]),"forward.x"),c=Ct(Number(e[1]),"forward.y"),h=Ct(Number(e[2]),"forward.z"),u=Math.hypot(l,c,h);if(!(u>0))throw new RangeError("forward cannot be zero");let d=Ct(Number(t),"verticalFovRadians");if(!(d>0&&d<Math.PI))throw new RangeError("verticalFovRadians must be between 0 and pi");let m=Ct(Number(n),"viewportHeightPx");if(!(m>0))throw new RangeError("viewportHeightPx must be positive");let g=Ct(Number(s),"near");if(!(g>0))throw new RangeError("near must be positive");return Object.freeze({position:new Float64Array([r,a,o]),forward:new Float64Array([l/u,c/u,h/u]),focalLengthPx:.5*m/Math.tan(.5*d),viewportHeightPx:m,verticalFovRadians:d,near:g})}function z0(i,e,t=new Float64Array(3)){if(!i||i.length!==4)throw new TypeError("sphere must be [x,y,z,radius]");if(!e)return t[0]=NaN,t[1]=NaN,t[2]=NaN,t;let n=i[0]-e.position[0],s=i[1]-e.position[1],r=i[2]-e.position[2],a=Math.hypot(n,s,r),o=n*e.forward[0]+s*e.forward[1]+r*e.forward[2],l=Math.max(0,i[3]),c=0;if(l>0)if(o<=e.near+l)c=1/0;else{let h=Math.sqrt(Math.max(e.near*e.near,o*o-l*l));c=2*e.focalLengthPx*l/h}return t[0]=c,t[1]=a,t[2]=o,t}function H0(i){for(let e of["getRoots","writeBounds","getDepth","getChildCount","getChild"])if(typeof i?.[e]!="function")throw new TypeError(`hierarchy.${e} must be a function`)}function ds({hierarchy:i,visibleFrustum:e,guardFrustum:t,projection:n=null,roots:s=null,maxDepth:r=0,refineProjectedDiameterPx:a=0,shouldRefine:o=null,epsilon:l=0}={}){H0(i);let c=zr(e,"visibleFrustum"),h=zr(t,"guardFrustum");if(!(Number.isInteger(r)&&r>=0))throw new RangeError("maxDepth must be a non-negative integer");if(Ct(a,"refineProjectedDiameterPx"),a<0)throw new RangeError("refineProjectedDiameterPx cannot be negative");if(o!==null&&typeof o!="function")throw new TypeError("shouldRefine must be a function or null");let u=s??i.getRoots();if(!u||typeof u.length!="number")throw new TypeError("roots must be an ordered ArrayLike of handles");let d=new us,m=new us,g=new us,x=new Float64Array(6),f=new Float64Array(4),p=new Float64Array(3),y=typeof i.isNodeEnabled=="function"?i.isNodeEnabled.bind(i):()=>!0,_=typeof i.writeProjectionSphere=="function",b={roots:u.length,visitedNodes:0,disabledNodes:0,planeTests:0,inheritedNodes:0,rejectedSubtrees:0,visibleSubtrees:0,guardSubtrees:0,maxDepthVisited:0};function S(w){if(_)i.writeProjectionSphere(w,f);else{let N=(x[0]+x[3])*.5,M=(x[1]+x[4])*.5,T=(x[2]+x[5])*.5;f[0]=N,f[1]=M,f[2]=T,f[3]=Math.hypot(x[3]-N,x[4]-M,x[5]-T)}z0(f,n,p)}function R(w,N){if(w=Number(w),!(Number.isInteger(w)&&w>=0&&w<=4294967295))throw new RangeError(`invalid opaque node handle: ${w}`);if(!y(w)){b.disabledNodes++;return}let M=i.getDepth(w);if(!(Number.isInteger(M)&&M>=0))throw new RangeError(`hierarchy returned invalid depth for ${w}`);b.visitedNodes++,b.maxDepthVisited=Math.max(b.maxDepthVisited,M),i.writeBounds(w,x),S(w);let T=N,F=zn.INSIDE;if(N===null){let I=Qc(c,x,l);if(b.planeTests++,I!==zn.OUTSIDE)T=hn.VISIBLE,F=I;else{let U=Qc(h,x,l);if(b.planeTests++,U!==zn.OUTSIDE)T=hn.GUARD,F=U;else{g.push(w,p,zn.OUTSIDE),b.rejectedSubtrees++;return}}}else b.inheritedNodes++;let X=i.getChildCount(w);if(!(Number.isInteger(X)&&X>=0))throw new RangeError(`hierarchy returned invalid child count for ${w}`);let j=X>0&&M<r;if(j&&(o?j=!!o(w,M,p[0],T,F):j=!Number.isFinite(p[0])||p[0]>a),j){let I=F===zn.INSIDE?T:null,U=0;for(let G=0;G<X;G++){let Y=i.getChild(w,G);if(!y(Y)){b.disabledNodes++;continue}U++,R(Y,I)}if(U>0)return}T===hn.VISIBLE?(d.push(w,p,F),b.visibleSubtrees++):(m.push(w,p,F),b.guardSubtrees++)}for(let w=0;w<u.length;w++)R(u[w],null);return Object.freeze({visible:d.finish(),guard:m.finish(),outside:g.finish(),stats:Object.freeze(b)})}var zn,hn,Br,Sa,O0,us,Hr=st(()=>{zn=Object.freeze({OUTSIDE:0,INTERSECT:1,INSIDE:2}),hn=Object.freeze({OUTSIDE:0,GUARD:1,VISIBLE:2}),Br=6,Sa=4,O0=6;us=class{constructor(e=32){this.length=0,this.nodeIds=new Uint32Array(e),this.projectedDiameterPx=new Float32Array(e),this.distanceMeters=new Float32Array(e),this.viewDepthMeters=new Float32Array(e),this.containment=new Uint8Array(e)}grow(){let e=Math.max(16,this.nodeIds.length*2);for(let t of["nodeIds","projectedDiameterPx","distanceMeters","viewDepthMeters","containment"]){let n=this[t],s=new n.constructor(e);s.set(n),this[t]=s}}push(e,t,n){this.length===this.nodeIds.length&&this.grow();let s=this.length++;this.nodeIds[s]=e,this.projectedDiameterPx[s]=t[0],this.distanceMeters[s]=t[1],this.viewDepthMeters[s]=t[2],this.containment[s]=n}finish(){return Object.freeze({nodeIds:this.nodeIds.slice(0,this.length),projectedDiameterPx:this.projectedDiameterPx.slice(0,this.length),distanceMeters:this.distanceMeters.slice(0,this.length),viewDepthMeters:this.viewDepthMeters.slice(0,this.length),containment:this.containment.slice(0,this.length)})}}});function oh(i,e){return`${i}_${e}`}function fs(i,e){if(!Number.isInteger(i))throw new TypeError(`${e} must be an integer`);return i}function wa(i){return i<Sn[1]?0:i<Sn[2]?1:i<Sn[3]?2:i<Sn[4]?3:i<Sn[5]?4:5}function ps(i,...e){for(let t of e)if(i?.[t]!==void 0)return i[t];return null}var Ux,k0,Ea,Ta,V0,G0,W0,ih,sh,je,ms,Sn,qt,rh,kr,Aa=st(()=>{Ux=to(Rr());Hr();k0=globalThis.GosperCore,Ea=7,Ta=1.15,V0=.1,G0=24,W0=12,ih=400,sh=6,je=5,ms=Object.freeze([1,7,49,343,2401,16807]),Sn=Object.freeze([0,1,8,57,400,2801]),qt=19608,rh=Object.freeze([1,7,49,343,2401,16807]);kr=class{constructor({manifest:e=null,manifestTiles:t=null,worldOrigin:n={x:0,y:0},core:s=k0,capOverscan:r=Ta,rootHeightRoundingM:a=V0,aggregateSkirtSafetyM:o=G0,unitSkirtSafetyM:l=W0}={}){if(!s)throw new Error("GosperCore is unavailable");let c=t??e?.tiles;if(!Array.isArray(c))throw new TypeError("manifestTiles must be an array");if(!(Number.isFinite(r)&&r>=1))throw new RangeError("capOverscan must be at least 1");this.core=s,this.maxDepth=je,this._rootHeightRoundingM=a,this._aggregateSkirtSafetyM=o,this._unitSkirtSafetyM=l,this._verticalFactor=1,this._verticalFloor=0,this._verticalOffset=0,this._addressScratch={island:0,local:0,depth:0,index:0},this._rawHeightScratch=new Float64Array(2);let h=c.slice().sort((x,f)=>x.yq-f.yq||x.yr-f.yr);this.islandCount=h.length;let u=Math.floor(4294967296/qt);if(h.length>u)throw new RangeError(`uint32 node handles support at most ${u} islands`);this._rootHandles=new Uint32Array(h.length),this._latticeQ=new Int32Array(h.length),this._latticeR=new Int32Array(h.length),this._rootX=new Float64Array(h.length),this._rootZ=new Float64Array(h.length),this._rootMean=new Float64Array(h.length),this._rootMin=new Float64Array(h.length),this._rootMax=new Float64Array(h.length),this._gspVersion=new Uint8Array(h.length),this._keys=new Array(h.length),this._islandByKey=new Map,this._decodedByIsland=new Array(h.length).fill(null);let d=Number(n?.x??0),m=Number(n?.y??0);for(let x=0;x<h.length;x++){let f=h[x],p=fs(f.yq,"tile.yq"),y=fs(f.yr,"tile.yr"),_=oh(p,y);if(this._islandByKey.has(_))throw new Error(`duplicate Gosper island ${_}`);let b=Number.isFinite(f.lx)?Number(f.lx):Number(f.x)-d,S=Number.isFinite(f.lz)?Number(f.lz):-(Number(f.y)-m),R=Number(f.hMean),w=Number(f.hMin),N=Number(f.hMax);if(![b,S,R,w,N].every(Number.isFinite)||w>N)throw new RangeError(`invalid manifest bounds for Gosper island ${_}`);this._rootHandles[x]=x*qt,this._latticeQ[x]=p,this._latticeR[x]=y,this._rootX[x]=b,this._rootZ[x]=S,this._rootMean[x]=R,this._rootMin[x]=w,this._rootMax[x]=N,this._gspVersion[x]=Number(f.gspVersion??e?.gsp_version??1),this._keys[x]=_,this._islandByKey.set(_,x)}this.horizontalRadiusByLevel=new Float64Array(sh);for(let x=0;x<=je;x++){let f=x===0?1:r;this.horizontalRadiusByLevel[x]=s.levelSize(x)/Math.sqrt(3)*f}this._localCenterX=new Float64Array(qt),this._localCenterZ=new Float64Array(qt);let g=s.offsets(je);for(let x=0;x<=je;x++){let f=ms[x],p=rh[je-x],y=Sn[x];for(let _=0;_<f;_++){let b=_*p,S=g[b*2],R=g[b*2+1],w=s.axialToWorld(S,R);this._localCenterX[y+_]=w[0],this._localCenterZ[y+_]=-w[1]}}}getRoots(){return this._rootHandles}getIslandIndex(e){let t=this._assertHandle(e);return Math.floor(t/qt)}getIslandKey(e){return this._assertIslandIndex(e),this._keys[e]}getIslandVersion(e){return this._assertIslandIndex(e),this._gspVersion[e]}writeIslandLattice(e,t=new Int32Array(2)){return this._assertIslandIndex(e),t[0]=this._latticeQ[e],t[1]=this._latticeR[e],t}getRootHandle(e){let t;if(typeof e=="string"){if(t=this._islandByKey.get(e),t===void 0)return null}else t=this._assertIslandIndex(e);return this._rootHandles[t]}getRootHandleForLattice(e,t){return this.getRootHandle(oh(e,t))}getDepth(e){let n=this._assertHandle(e)%qt;return wa(n)}getLevel(e){return je-this.getDepth(e)}getChildCount(e){return this.getDepth(e)<je?Ea:0}getChild(e,t){let n=this._assertHandle(e);if(fs(t,"childIndex"),t<0||t>=Ea)throw new RangeError("childIndex must be 0..6");let s=Math.floor(n/qt),r=n-s*qt,a=wa(r);if(a===je)throw new RangeError("unit nodes have no children");let o=r-Sn[a];return s*qt+Sn[a+1]+o*Ea+t}isNodeEnabled(e){let t=this._address(e),s=this._decodedByIsland[t.island]?.depths?.[t.depth]?.valid;return s?s[t.index]!==0:!0}attachDecodedIsland(e,t){let n=this._resolveIsland(e),s=t?.depths;if(!Array.isArray(s)||s.length!==sh)throw new TypeError("decoded.depths must contain depths 0..5");for(let r=0;r<=je;r++){let a=s[r],o=ms[r];if(!a?.h||a.h.length!==o)throw new RangeError(`decoded depth ${r} needs ${o} heights`);if(a.valid&&a.valid.length!==o)throw new RangeError(`decoded depth ${r} validity length mismatch`);for(let l of["relief","downExtent","upExtent","renderDown","renderUp"])if(a[l]&&a[l].length!==o)throw new RangeError(`decoded depth ${r} ${l} length mismatch`)}this._decodedByIsland[n]=t}detachDecodedIsland(e){this._decodedByIsland[this._resolveIsland(e)]=null}setVerticalTransform({factor:e=1,floor:t=0,offset:n=0}={}){for(let[s,r]of Object.entries({factor:e,floor:t,offset:n}))if(!Number.isFinite(r))throw new TypeError(`${s} must be finite`);this._verticalFactor=e,this._verticalFloor=t,this._verticalOffset=n}writeBounds(e,t=new Float64Array(6)){let n=this._address(e),s=n.local,r=je-n.depth,a=this.horizontalRadiusByLevel[r],o=this._rootX[n.island]+this._localCenterX[s],l=this._rootZ[n.island]+this._localCenterZ[s],c=this._rawHeightBounds(n),h=this._toSceneY(c[0]),u=this._toSceneY(c[1]);return t[0]=o-a,t[1]=Math.min(h,u),t[2]=l-a,t[3]=o+a,t[4]=Math.max(h,u),t[5]=l+a,t}writeProjectionSphere(e,t=new Float64Array(4)){let n=this._address(e),s=n.local,r=je-n.depth;return t[0]=this._rootX[n.island]+this._localCenterX[s],t[1]=this._toSceneY(this._nodeMean(n)),t[2]=this._rootZ[n.island]+this._localCenterZ[s],t[3]=this.horizontalRadiusByLevel[r],t}writeNodeAddress(e,t=new Uint32Array(4)){let n=this._address(e);return t[0]=n.island,t[1]=n.depth,t[2]=n.index,t[3]=je-n.depth,t}writeDescendantRange(e,t,n=new Uint32Array(4)){let s=this._address(e);if(fs(t,"targetDepth"),t<s.depth||t>je)throw new RangeError(`targetDepth must be ${s.depth}..${je}`);let r=rh[t-s.depth];return n[0]=s.island,n[1]=s.index*r,n[2]=r,n[3]=t,n}summarizePlanByIsland(e){let t=new Uint8Array(this.islandCount),n=new Float32Array(this.islandCount),s=new Float32Array(this.islandCount),r=new Float32Array(this.islandCount),a=new Uint8Array(this.islandCount);s.fill(1/0),r.fill(1/0);let o=(l,c)=>{for(let h=0;h<l.nodeIds.length;h++){let u=this.getIslandIndex(l.nodeIds[h]);a[u]=1,t[u]=Math.max(t[u],c),n[u]=Math.max(n[u],l.projectedDiameterPx[h]),s[u]=Math.min(s[u],l.distanceMeters[h]),r[u]=Math.min(r[u],l.viewDepthMeters[h])}};return o(e.outside,hn.OUTSIDE),o(e.guard,hn.GUARD),o(e.visible,hn.VISIBLE),Object.freeze({classification:t,projectedDiameterPx:n,distanceMeters:s,viewDepthMeters:r,present:a})}_resolveIsland(e){if(typeof e=="string"){let t=this._islandByKey.get(e);if(t===void 0)throw new RangeError(`unknown Gosper island ${e}`);return t}return this._assertIslandIndex(e)}_assertIslandIndex(e){if(fs(e,"islandIndex"),e<0||e>=this.islandCount)throw new RangeError(`islandIndex ${e} is out of range`);return e}_assertHandle(e){let t=Number(e);if(!(Number.isInteger(t)&&t>=0&&t<this.islandCount*qt))throw new RangeError(`invalid Gosper node handle ${e}`);return t}_address(e){let t=this._assertHandle(e),n=Math.floor(t/qt),s=t-n*qt,r=wa(s),a=this._addressScratch;return a.island=n,a.local=s,a.depth=r,a.index=s-Sn[r],a}_nodeMean(e){let n=this._decodedByIsland[e.island]?.depths?.[e.depth]?.h?.[e.index];return Number.isFinite(n)?n:this._rootMean[e.island]}_rawHeightBounds(e){let t=this._rawHeightScratch,n=e.island,s=this._rootMin[n]-this._rootHeightRoundingM,r=this._rootMax[n]+this._rootHeightRoundingM,a=Math.min(s,this._rootMean[n]-(r-s)-this._aggregateSkirtSafetyM,s-ih-this._unitSkirtSafetyM),o=r+ih,l=this._decodedByIsland[n];if(e.depth===0||!l)return t[0]=a,t[1]=o,t;let c=l.depths[e.depth],h=this._nodeMean(e);if(e.depth===je){let m=ps(l.unit,"d1"),g=ps(l.unit,"d2"),x=ps(l.unit,"d3");if(m&&g&&x){let f=h-Number(m[e.index])*.1,p=h-Number(g[e.index])*.1,y=h-Number(x[e.index])*.1;return t[0]=Math.min(h,f-this._unitSkirtSafetyM,p-this._unitSkirtSafetyM,y-this._unitSkirtSafetyM)-.1,t[1]=Math.max(h,f,p,y)+.1,t}return t[0]=a,t[1]=o,t}if(this._gspVersion[n]<3)return t[0]=a,t[1]=o,t;let u=ps(c,"renderDown"),d=ps(c,"renderUp");return u&&d?(t[0]=h-Number(u[e.index])*.1,t[1]=h+Number(d[e.index])*.1,t):(t[0]=a,t[1]=o,t)}_toSceneY(e){return(e-this._verticalFloor)*this._verticalFactor+this._verticalOffset}}});function Y0(i){let e=0;for(let t=1;t<i.length;t+=2)e+=i[t];return e}function lh(i){if(i.length===0)return new Uint32Array;i.sort((s,r)=>s[0]-r[0]||s[1]-r[1]);let e=[],t=i[0][0],n=t+i[0][1];for(let s=1;s<i.length;s++){let r=i[s][0],a=r+i[s][1];r<=n?n=Math.max(n,a):(e.push(t,n-t),t=r,n=a)}return e.push(t,n-t),new Uint32Array(e)}function ah(i,e){let t=[],n=0;for(;n<i.length;){for(;n<i.length&&!!i[n]!==e;)n++;let s=n;for(;n<i.length&&!!i[n]===e;)n++;n>s&&t.push([s,n-s])}return lh(t)}function ch(i,e){if(!i)return!0;for(let t=un+1;t<=je;t++){let n=i.rangesByDepth[t],s=e.rangesByDepth[t];if(!n||!s||n.length!==s.length)return!0;for(let r=0;r<n.length;r++)if(n[r]!==s[r])return!0}return!1}function hh({adapter:i,rootHandle:e,visibleFrustum:t,guardFrustum:n,projection:s,detailDistanceByDepth:r=X0,detailMarginMeters:a=650}){if(!i)throw new TypeError("adapter is required");if(!r||r.length<=je)throw new TypeError("detailDistanceByDepth must contain depths 0..5");let o=ds({hierarchy:i,roots:new Uint32Array([e]),visibleFrustum:t,guardFrustum:n,projection:s,maxDepth:un}),l=new Uint8Array(ms[un]),c=new Uint8Array(l.length),h=Array.from({length:je+1},()=>[]),u=new Uint32Array(4),d=new Uint32Array(4),m=i.horizontalRadiusByLevel[je-un];function g(_,b){for(let S=0;S<_.nodeIds.length;S++){let R=_.nodeIds[S];if(i.writeNodeAddress(R,u),u[1]!==un)throw new Error(`geometry frontier stopped at depth ${u[1]}, expected L3/depth 2`);let w=u[2];l[w]=1,b&&(c[w]=1);let N=_.distanceMeters[S];for(let M=un+1;M<=je;M++){let T=Number(r[M]);Number.isFinite(N)&&N-m<=T+a&&(i.writeDescendantRange(R,M,d),h[M].push([d[1],d[2]]))}}}g(o.visible,!0),g(o.guard,!1);let x=new Array(je+1);for(let _=0;_<=un;_++)x[_]=new Uint32Array([0,ms[_]]);for(let _=un+1;_<=je;_++)x[_]=lh(h[_]);let f=new Uint32Array(je+1),p=0;for(let _=0;_<=je;_++)f[_]=Y0(x[_]),_>un&&(p+=f[_]);let y=x.slice(un+1).map(_=>Array.from(_).join(",")).join("|");return Object.freeze({rangesByDepth:x,selectedCounts:f,detailNodeCount:p,activeL3Count:l.reduce((_,b)=>_+b,0),visibleL3Count:c.reduce((_,b)=>_+b,0),excludedL3Count:l.length-l.reduce((_,b)=>_+b,0),activeL3Ranges:ah(l,!0),outsideL3Ranges:ah(l,!1),signature:y,plannerStats:o.stats})}var un,X0,uh=st(()=>{Hr();Aa();un=2,X0=Object.freeze([1/0,1/0,1/0,1e4,5e3,2e3])});function dh(i){return!!i}function Gr(i,e,t=new Float64Array(10)){if(!i?.position||!i?.quaternion||!e)throw new TypeError("camera position/quaternion and controls target are required");return t[0]=i.position.x,t[1]=i.position.y,t[2]=i.position.z,t[3]=i.quaternion.x,t[4]=i.quaternion.y,t[5]=i.quaternion.z,t[6]=i.quaternion.w,t[7]=e.x,t[8]=e.y,t[9]=e.z,t}function fh(i,e,t=1e-7){if(!i||!e||i.length!==10||e.length!==10)throw new TypeError("camera poses must contain 10 values");for(let n=0;n<10;n++)if(Math.abs(i[n]-e[n])>t)return!0;return!1}function Ra(i,e=2){return e>=2&&i?q0:$0}function ph(i,e){return!!(i||e)}function mh(i,e){return i.lodPaused=!!e,i.lodPaused||(i.needsLODUpdate=!0,i.needsRender=!0),i.lodPaused}function Wr({taskEpoch:i,currentEpoch:e,taskSignature:t,desiredSignature:n,taskMode:s,isMovingView:r}){return i===e&&t===n&&s===(r?"moving":"settled")}var q0,$0,Vr,gh=st(()=>{q0=Object.freeze([5,4,3]),$0=Object.freeze([5,4,3,2,1,0]),Vr=class{constructor(e=200){if(!Number.isFinite(e)||e<0)throw new TypeError("settleDelayMs must be a non-negative finite number");this.settleDelayMs=e,this.lastMotionTime=-1/0}note(e){if(!Number.isFinite(e))throw new TypeError("motion time must be finite");this.lastMotionTime=Math.max(this.lastMotionTime,e)}enterMotion(e,t){return this.note(e),!t}sample({now:e}={}){if(!Number.isFinite(e))throw new TypeError("sample time must be finite");return e-this.lastMotionTime<=this.settleDelayMs}}});function xh(i,e=null){if(!i||typeof i[Symbol.iterator]!="function")return NaN;let t=Number(e?.x),n=Number(e?.z);if(!Number.isFinite(t)||!Number.isFinite(n))return NaN;let s=1/0,r=1/0;for(let a of i){let o=Number(a?.hMin);if(!Number.isFinite(o))continue;let l=Number(a?.lx),c=Number(a?.lz);if(!Number.isFinite(l)||!Number.isFinite(c))continue;let h=(l-t)**2+(c-n)**2;h<r&&(r=h,s=o)}return Number.isFinite(s)?s:NaN}function _h({cameraY:i,targetY:e,sourceElevation:t,floor:n,factor:s}){let r={cameraY:i,targetY:e,sourceElevation:t,floor:n,factor:s};for(let[l,c]of Object.entries(r))if(!Number.isFinite(c))throw new TypeError(`${l} must be finite`);if(s<0)throw new RangeError("factor must be non-negative");let a=(t-n)*s,o=a-e;return Object.freeze({terrainY:a,translationY:o,targetY:a,cameraY:i+o})}function yh({cameraY:i,sourceElevation:e,floor:t,factor:n,clearance:s=50}){let r={cameraY:i,sourceElevation:e,floor:t,factor:n,clearance:s};for(let[c,h]of Object.entries(r))if(!Number.isFinite(h))throw new TypeError(`${c} must be finite`);if(n<0)throw new RangeError("factor must be non-negative");if(s<0)throw new RangeError("clearance must be non-negative");let a=(e-t)*n,o=a+s,l=Math.max(i,o);return Object.freeze({terrainY:a,minCameraY:o,cameraY:l,clamped:l!==i})}var vh=st(()=>{});function Lt(i,e){let t=Number(i);if(!Number.isFinite(t))throw new TypeError(`${e} must be finite`);return t}function Vi(i,e){let t=Number(i);if(!Number.isInteger(t))throw new TypeError(`${e} must be an integer`);return t}function Mh(i,e){return`${Vi(i,"pageX")}_${Vi(e,"pageY")}`}function Xr(i,e,t){let n=Lt(i,"coordinate"),s=Lt(e,"origin"),r=Lt(t,"pageSize");if(!(r>0))throw new RangeError("pageSize must be positive");return Math.floor((n-s)/r)}function bh(i,e,t,n){let s=(i-e)/t;return Math.max(n,Math.ceil(s)-1)}function Z0(i){if(!i||typeof i!="object")throw new TypeError("bounds must be an object");let e=Lt(i.minX??i.min_x,"bounds.minX"),t=Lt(i.minY??i.min_y,"bounds.minY"),n=Lt(i.maxX??i.max_x,"bounds.maxX"),s=Lt(i.maxY??i.max_y,"bounds.maxY");if(n<e||s<t)throw new RangeError("bounds must be ordered");return{minX:e,minY:t,maxX:n,maxY:s}}function K0(i,e,t,n){return i.replace("{page_x}",String(e)).replace("{page_y}",String(t)).replace("{tier}",String(n))}var Yr,Sh=st(()=>{Yr=class{constructor(e,{expectedCrs:t=null}={}){if(!e||typeof e!="object")throw new TypeError("texture page contract is required");let n=e.grid;if(!n||typeof n!="object")throw new TypeError("texture page grid is required");if(n.index_rule!=="floor")throw new Error("texture page index_rule must be 'floor'");if(this.crs=String(n.crs||""),t!==null&&this.crs!==t)throw new Error(`texture page CRS must be ${t}, got ${this.crs||"<missing>"}`);if(this.originX=Lt(n.origin_x,"grid.origin_x"),this.originY=Lt(n.origin_y,"grid.origin_y"),this.pageSize=Lt(n.page_size_m,"grid.page_size_m"),!(this.pageSize>0))throw new RangeError("grid.page_size_m must be positive");this.urlTemplate=String(e.url_template||""),this.cacheKey=e.cache_key??e.recipe_version??"",this.contract=e,this.pages=[],this.pageByKey=new Map;for(let s of e.pages||[]){let r=Vi(s.page_x,"page.page_x"),a=Vi(s.page_y,"page.page_y"),o=Mh(r,a);if(s.key!==void 0&&String(s.key)!==o)throw new Error(`page key ${s.key} does not match ${o}`);if(this.pageByKey.has(o))throw new Error(`duplicate texture page ${o}`);let l=this.cell(r,a);for(let[g,x]of[["min_x",l.minX],["min_y",l.minY],["max_x",l.maxX],["max_y",l.maxY]])if(s[g]!==void 0&&Math.abs(Number(s[g])-x)>1e-6)throw new Error(`page ${o} ${g} is not aligned to the global grid`);let c=Lt(s.hMin,`page ${o} hMin`),h=Lt(s.hMax,`page ${o} hMax`);if(h<c)throw new RangeError(`page ${o} height bounds must be ordered`);let u=Lt(s.renderMin,`page ${o} renderMin`),d=Lt(s.renderMax,`page ${o} renderMax`);if(d<u||u>c||d<h)throw new RangeError(`page ${o} rendered height bounds must conservatively contain terrain`);let m=Object.freeze({key:o,pageX:r,pageY:a,minX:l.minX,minY:l.minY,maxX:l.maxX,maxY:l.maxY,hMin:c,hMax:h,renderMin:u,renderMax:d,coverageTileCount:Number(s.coverage_tile_count||0),urls:Object.freeze({...s.urls||{}}),available:!0});this.pages.push(m),this.pageByKey.set(o,m)}this.pages.sort((s,r)=>s.pageY-r.pageY||s.pageX-r.pageX),Object.freeze(this.pages)}indicesForPoint(e,t){return Object.freeze({pageX:Xr(e,this.originX,this.pageSize),pageY:Xr(t,this.originY,this.pageSize)})}cell(e,t){e=Vi(e,"pageX"),t=Vi(t,"pageY");let n=this.originX+e*this.pageSize,s=this.originY+t*this.pageSize,r=Mh(e,t),a=this.pageByKey?.get(r);return a||Object.freeze({key:r,pageX:e,pageY:t,minX:n,minY:s,maxX:n+this.pageSize,maxY:s+this.pageSize,hMin:0,hMax:0,renderMin:0,renderMax:0,coverageTileCount:0,urls:Object.freeze({}),available:!1})}pageForPoint(e,t,{includeMissing:n=!0}={}){let{pageX:s,pageY:r}=this.indicesForPoint(e,t),a=this.cell(s,r);return a.available||n?a:null}pagesForBounds(e,{includeMissing:t=!0,maxPages:n=1/0}={}){let s=Z0(e),r=Xr(s.minX,this.originX,this.pageSize),a=Xr(s.minY,this.originY,this.pageSize),o=bh(s.maxX,this.originX,this.pageSize,r),l=bh(s.maxY,this.originY,this.pageSize,a),c=(o-r+1)*(l-a+1);if(c>n)throw new RangeError(`bounds intersect ${c} texture pages; maximum is ${n}`);let h=[];for(let u=a;u<=l;u++)for(let d=r;d<=o;d++){let m=this.cell(d,u);(m.available||t)&&h.push(m)}return h}urlFor(e,t){let n=typeof e=="string"?this.pageByKey.get(e):e;if(!n?.available)return null;let s=n.urls?.[t];return s||(this.urlTemplate?K0(this.urlTemplate,n.pageX,n.pageY,t):null)}}});function J0(i,e){return!!(i?.assets?.has(e)||i?.failed?.has(e))}function $r(i,{includeOutside:e=!1}={}){return!!(i&&(e||i.classification!=="outside"))}function j0(i,{includeOutside:e=!0}={}){let t=i instanceof Map?i.values():i||[];for(let n of t)if($r(n,{includeOutside:e})&&!J0(n,ht.LOW))return!0;return!1}function Eh(i,e,{includeOutside:t=!1}={}){let n=[];for(let s of i||[]){let r=e?.get?.(s?.key)||null,a=$r(r,{includeOutside:t}),o=Hn[r?.desiredTier??ht.LOW],l=Hn[s?.tier],c=t||Number.isFinite(l)&&Number.isFinite(o)&&l<=o;a&&c?n.push(s):r&&s?.tier&&r.queued?.delete?.(s.tier)}return n}function wh(i,e,{isMoving:t=!1,lowCoverageFirst:n=!1,lowCoverageIncludesOutside:s=!0}={}){let r=n&&j0(e,{includeOutside:s}),a=-1,o=-1/0;for(let l=0;l<(i||[]).length;l++){let c=i[l];if(!c||t&&c.tier===ht.HIGH||r&&c.tier!==ht.LOW)continue;let h=Number.isFinite(c.priority)?c.priority:0;(a<0||h>o)&&(a=l,o=h)}return a}function Q0(i,e,t,n){if(t==="outside")return ht.LOW;let s=i.desiredTier||ht.LOW,r=n.highEnterPx*n.hysteresis;return t==="visible"&&(s===ht.HIGH&&e>=r||e>=n.highEnterPx)?ht.HIGH:s!==ht.LOW&&e>=n.mediumExitPx||e>=n.mediumEnterPx?ht.MEDIUM:ht.LOW}var ht,Hn,Ca,qr,Th=st(()=>{ht=Object.freeze({LOW:"low128",MEDIUM:"medium256",HIGH:"high4096"}),Hn=Object.freeze({[ht.LOW]:0,[ht.MEDIUM]:1,[ht.HIGH]:2});Ca=Object.freeze({outside:0,guard:1,visible:2});qr=class{constructor({pages:e,mini:t=!1,mediumEnterPx:n=96,mediumExitPx:s=72,highEnterPx:r=512,hysteresis:a=.75}){this.mini=!!t,this.thresholds={mediumEnterPx:n,mediumExitPx:s,highEnterPx:r,hysteresis:a},this.states=new Map,this.consumerPages=new Map;for(let o of e||[]){if(!o?.key)throw new TypeError("every texture page needs a key");if(this.states.has(o.key))throw new Error(`duplicate texture page ${o.key}`);this.states.set(o.key,{key:o.key,page:o,consumers:new Set,assets:new Map,loading:new Set,queued:new Set,failed:new Set,desiredTier:ht.LOW,activeTier:null,classification:"outside",projectedDiameterPx:0,perceptibility:0,_nextClassification:"outside",_nextProjectedDiameterPx:0,_nextPerceptibility:0})}}state(e){let t=typeof e=="string"?e:e?.key;return this.states.get(t)||null}attachConsumer(e,t){this.detachConsumer(e);let n=Array.from(new Set(t||[]));this.consumerPages.set(e,n);for(let s of n)this.states.get(s)?.consumers.add(e);return n}detachConsumer(e){let t=this.consumerPages.get(e);if(t){for(let n of t)this.states.get(n)?.consumers.delete(e);this.consumerPages.delete(e)}}pagesForConsumer(e){return[...this.consumerPages.get(e)||[]]}beginDemandPass(){for(let e of this.states.values())e._nextClassification="outside",e._nextProjectedDiameterPx=0,e._nextPerceptibility=0}contribute(e,{classification:t="outside",projectedDiameterPx:n=0,perceptibility:s=0}={}){let r=this.state(e);if(!r)return null;if(!(t in Ca))throw new Error(`unknown classification ${t}`);return Ca[t]>Ca[r._nextClassification]&&(r._nextClassification=t),r._nextProjectedDiameterPx=Math.max(r._nextProjectedDiameterPx,Number.isFinite(n)?n:1/0),r._nextPerceptibility=Math.max(r._nextPerceptibility,Number.isFinite(s)?s:0),r}finishDemandPass({highEnterPx:e=null}={}){let t=e===null?this.thresholds:{...this.thresholds,highEnterPx:e};for(let n of this.states.values())n.classification=n._nextClassification,n.projectedDiameterPx=n._nextProjectedDiameterPx,n.perceptibility=n._nextPerceptibility,n.desiredTier=Q0(n,n.projectedDiameterPx,n.classification,t);return this.states.values()}bestAsset(e,t=null,n=null){let s=typeof e=="string"?this.state(e):e;if(!s)return null;let r=t||s.desiredTier,a=Hn[r],o=Array.from(s.assets.entries()).filter(([c])=>c!==n).sort((c,h)=>Hn[h[0]]-Hn[c[0]]);return o.find(([c])=>Hn[c]<=a)||o[o.length-1]||null}replaceAsset(e,t,n,{rebind:s=()=>{},dispose:r=()=>{}}={}){let a=this.state(e);if(!a)throw new Error(`unknown texture page ${e}`);let o=a.assets.get(t)||null;return a.assets.set(t,n),o&&a.activeTier===t&&s(a),o&&r(o),o}dropAsset(e,t,n,{rebind:s=()=>{},dispose:r=()=>{}}={}){let a=this.state(e);if(!a)return!1;let o=a.assets.get(t);if(!o)return!0;if(a.activeTier===t){if(!n)return!1;a.assets.delete(t),a.activeTier=n[0],s(a)}else a.assets.delete(t);return r(o),!0}}});function tx(){return Object.fromEntries(kn.map(i=>[i.tier,new Set]))}function Pa(){return Object.fromEntries(kn.map(i=>[i.tier,0]))}function Ah(i){return i?.entries||Array.isArray(i)?i.entries():Object.entries(i||{})}function Rh(i,e){return i?.get&&i.get(e)?.classification||null}function Ia(i,e){if(!i||i.visible===!1)return;let t=!Number.isFinite(i.count)||i.count>0;if(i.material&&t){let n=Array.isArray(i.material)?i.material:[i.material];for(let s of n)s?.visible!==!1&&e(s)}for(let n of i.children||[])Ia(n,e)}function Ch(i,e){let t=tx();for(let[n,s]of Ah(i))!s||s.container?.visible===!1||s.mesh?.visible===!1||Rh(e,n)==="visible"&&Ia(s.mesh,r=>{let a=r.userData?.texturePageBindings;if(Array.isArray(a))for(let o of a){let l=o?.tier,c=o?.page?.key;!o?.valid||!o?.texture||!c||!ex.has(l)||t[l].add(String(c))}});return t}function Ph(i,e){let t=0;for(let[n,s]of Ah(i)){if(!s||s.container?.visible===!1||s.mesh?.visible===!1||Rh(e,n)!=="visible")continue;let r=!1;Ia(s.mesh,a=>{if(r)return;let o=a.userData?.texturePageBindings;if(Array.isArray(o)){for(let l of o)if(l?.page?.available&&(!l?.valid||!l?.texture)){r=!0;return}}}),r&&t++}return t}function Ih(i){let e=Pa(),t=Pa(),n=Pa(),s=i?.values?i.values():i||[];for(let r of s)for(let{tier:a}of kn)r?.assets?.has(a)&&e[a]++,(r?.queued?.has(a)||r?.loading?.has(a))&&t[a]++,r?.failed?.has(a)&&n[a]++;return{loaded:e,pending:t,failed:n}}var kn,ex,Lh=st(()=>{kn=Object.freeze([Object.freeze({tier:"low128",label:"LOW",size:128,color:"#00ff30"}),Object.freeze({tier:"medium256",label:"MED",size:256,color:"#0060ff"}),Object.freeze({tier:"high4096",label:"HIGH",size:4096,color:"#ff00aa"})]),ex=new Set(kn.map(i=>i.tier))});var Zr,Dh=st(()=>{Zr=class{constructor({pages:e,worldOrigin:t}){if(!Array.isArray(e))throw new TypeError("pages must be an array");if(!t||!Number.isFinite(t.x)||!Number.isFinite(t.y))throw new TypeError("worldOrigin must contain finite x/y");this.pages=e,this.worldOrigin={x:t.x,y:t.y},this.roots=Uint32Array.from(e.map((n,s)=>s)),this.verticalFactor=1,this.verticalFloor=0,this.verticalOffset=0}getRoots(){return this.roots}getDepth(){return 0}getChildCount(){return 0}getChild(){throw new RangeError("texture pages have no children")}getPage(e){let t=this.pages[Number(e)];if(!t)throw new RangeError(`invalid texture page handle ${e}`);return t}getPageKey(e){return this.getPage(e).key}setVerticalTransform({factor:e=1,floor:t=0,offset:n=0}={}){for(let[s,r]of Object.entries({factor:e,floor:t,offset:n}))if(!Number.isFinite(r))throw new TypeError(`${s} must be finite`);this.verticalFactor=e,this.verticalFloor=t,this.verticalOffset=n}sourceHeightToScene(e){return(e-this.verticalFloor)*this.verticalFactor+this.verticalOffset}writeBounds(e,t=new Float64Array(6)){let n=this.getPage(e),s=this.sourceHeightToScene(n.renderMin),r=this.sourceHeightToScene(n.renderMax);return t[0]=n.minX-this.worldOrigin.x,t[1]=Math.min(s,r),t[2]=-(n.maxY-this.worldOrigin.y),t[3]=n.maxX-this.worldOrigin.x,t[4]=Math.max(s,r),t[5]=-(n.minY-this.worldOrigin.y),t}writeProjectionSphere(e,t=new Float64Array(4)){let n=this.getPage(e),s=.5*Math.hypot(n.maxX-n.minX,n.maxY-n.minY),r=.5*Math.abs(this.verticalFactor)*(n.hMax-n.hMin);return t[0]=(n.minX+n.maxX)*.5-this.worldOrigin.x,t[1]=this.sourceHeightToScene((n.hMin+n.hMax)*.5),t[2]=-((n.minY+n.maxY)*.5-this.worldOrigin.y),t[3]=Math.hypot(s,r),t}}});function Nh(i=9){if(!(Number.isInteger(i)&&i>=1&&i<=16))throw new RangeError("bindingCount must be an integer from 1 to 16");let e=Array.from({length:i-1},(a,o)=>`uniform sampler2D uPageMap${o+1};`).join(`
                `),t=Array.from({length:i},(a,o)=>`uniform vec2 uPageOrigin${o};`).join(`
                `),n=Array.from({length:i},(a,o)=>`uniform float uPageValid${o};`).join(`
                `),s=`vec2 pageGradientUv = sourceXY / uPageSize;
                    vec2 pageGradientDx = dFdx(pageGradientUv);
                    vec2 pageGradientDy = dFdy(pageGradientUv);`,r=Array.from({length:i},(a,o)=>`${o===0?"if":"else if"} (uPageValid${o} > 0.5 &&
                        all(greaterThanEqual(sourceXY, uPageOrigin${o})) &&
                        all(lessThan(sourceXY, uPageOrigin${o} + vec2(uPageSize)))) {
                        texColor = textureGrad(${o===0?"map":`uPageMap${o}`},
                            (sourceXY - uPageOrigin${o}) / uPageSize,
                            pageGradientDx, pageGradientDy);
                        sampledPage = true;
                    }`).join(" ");return Object.freeze({declarations:`${e}
                ${t}
                ${n}
                uniform float uPageSize;
                uniform vec2 uSourceOrigin;`,samplingBranches:`${s}
                    ${r}`})}var Uh=st(()=>{});function Fh(i,{capOverscan:e=1.15}={}){if(!i||typeof i.offsets!="function"||typeof i.axialToWorld!="function")throw new TypeError("canonical Gosper core is required");let t=i.TILE_LEVEL,n=i.offsets(t),s=1/0,r=1/0,a=-1/0,o=-1/0;for(let l=0;l<=t;l++){let c=t-l,h=Math.pow(7,c),u=c===0?1:e,d=i.levelSize(c)/Math.sqrt(3)*u;for(let m=0;m<n.length/2;m+=h){let[g,x]=i.axialToWorld(n[m*2],n[m*2+1]);s=Math.min(s,g-d),r=Math.min(r,x-d),a=Math.max(a,g+d),o=Math.max(o,x+d)}}return Object.freeze({minOffsetX:s,minOffsetY:r,maxOffsetX:a,maxOffsetY:o})}function Oh(i,e,t){if(![i,e,t?.minOffsetX,t?.minOffsetY,t?.maxOffsetX,t?.maxOffsetY].every(Number.isFinite))throw new TypeError("finite island center and source footprint are required");return Object.freeze({minX:i+t.minOffsetX,minY:e+t.minOffsetY,maxX:i+t.maxOffsetX,maxY:e+t.maxOffsetY})}function Bh(i,e=null){let t=i?.tile_source_footprint_half_m,n=Number(t?.x),s=Number(t?.y);if(!(Number.isFinite(n)&&n>0&&Number.isFinite(s)&&s>0))throw new Error("geometry.tile_source_footprint_half_m needs positive finite x/y");if(i.footprint_semantics!=="conservative_render_coverage")throw new Error("geometry footprint must describe conservative_render_coverage");if(e){let r=Math.max(-e.minOffsetX,e.maxOffsetX),a=Math.max(-e.minOffsetY,e.maxOffsetY);if(n+1e-6<r||s+1e-6<a)throw new Error("manifest geometry footprint does not cover rendered caps")}return Object.freeze({minOffsetX:-n,minOffsetY:-s,maxOffsetX:n,maxOffsetY:s})}var zh=st(()=>{});var px=Ga(()=>{Er();Fc();zc();Hc();kc();Gc();$c();jc();Hr();Aa();uh();gh();vh();Sh();Th();Lh();Dh();Uh();zh();var f_=to(Rr()),wn=window.GosperCore,nx="./tile_worker.21803cd3bff3.js",Kr="v0.10.0-rc5",gs={MOVING_2D:"MOVING_2D",MOVING_3D:"MOVING_3D",SINTERING:"SINTERING",STATIC:"STATIC"},ix={MOVING_2D:16,MOVING_3D:16,SINTERING:1200,STATIC:0},sx=5,Hh=200;function xs(i,e){return e()}var rx=32,ox=.2,Na=rx*ox,dn=5,ax=50,Ue=ht,Gi=Hn,Pt=Object.freeze({mediumEnterPx:96,mediumExitPx:72,highEnterPx:512,highExitPx:384,maxTextureJobs:2,maxUploadsPerFrame:1});function La(i,e){if(e==null||e==="")return i;let t=i.includes("?")?"&":"?";return`${i}${t}v=${encodeURIComponent(String(e))}`}function lx(i,e){let t=Na,n=i/(Math.sqrt(3)/2*t),s=(e-n*.5*t)/t,r=n,a=s,o=-n-s,l=Math.round(r),c=Math.round(o),h=Math.round(a),u=Math.abs(l-r),d=Math.abs(c-o),m=Math.abs(h-a);return u>d&&u>m?l=-c-h:d>m?c=-l-h:h=-l-c,{q:l,r:h}}var kh=4e3,Da=6e4,cx="view-min",Vh=!0,hx=.02,ux=-1e4,dx=1e4,fx={"astc-4x4":Ys,"astc-6x6":qs,"astc-8x6":$s,bc7:ji,bc1:Ji,etc1:vr,"pvrtc-rgb":Xs},Ua=class{constructor(){console.log(`[HEXAGONS] ${Kr} \u2014 loading...`),this.container=document.getElementById("canvas-container"),this.scene=new pr,this.scene.background=new Xe(657930),this.camera=new Rt(60,window.innerWidth/window.innerHeight,10,5e4),this.camera.position.set(0,800,0),this.renderer=new as({antialias:!0,preserveDrawingBuffer:!0}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.setPixelRatio(window.devicePixelRatio),this.container.appendChild(this.renderer.domElement),this.controls=new Ar(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=.08,this.controls.screenSpacePanning=!1,this.controls.minDistance=100,this.controls.maxDistance=5e4,this.controls.maxPolarAngle=Math.PI/2.1,this.isUserInteracting=!1,this.isMovingView=!1,this.cameraMotion=new Vr(300),this.controls.addEventListener("start",()=>{this.isUserInteracting=!0,this.notifyCameraMotion(performance.now())}),this.controls.addEventListener("end",()=>{this.isUserInteracting=!1;let t=performance.now();this.isMovingView&&this.cameraMotion.note(t)}),this.controls.addEventListener("change",()=>{dh(this.isUserInteracting)&&this.notifyCameraMotion(performance.now())}),this.renderer.domElement.addEventListener("wheel",()=>{this.notifyCameraMotion(performance.now())},{capture:!0,passive:!0}),this.lastObservedCameraPose=Gr(this.camera,this.controls.target),this.observedCameraPose=new Float64Array(10),this.viewState=new Or(this),this.needsRender=!0,this.lastLODCamPos=new L().copy(this.camera.position),this.settledLodRadii=new Float32Array([2e3,5e3,1e4,25e3,6e4,1e9]),this.movingLevel=3,this.lodRadii=new Float32Array(dn+1),this.computeLodRadii(),this.lodTileMargin=650,window.addEventListener("resize",this.onResize.bind(this));let e=Na/Math.sqrt(3);this.hexGeometry=this.createHexGeometry(e),this.tiles=new Map,this.manifest=null,this.loadingTiles=new Set,this.loadQueue=[],this.geometryRebuildQueue=[],this.geometryPlanEpoch=0,this.textureQueue=[],this.textureResultQueue=[],this.textureStates=new Map,this.texturePageGrid=null,this.texturePageResidency=null,this.texturePageVisibilityAdapter=null,this.texturePagePlanStats=null,this.missingPageTexture=this.createMissingPageTexture(),this.visibilityByKey=new Map,this.currentVisibilityContext=null,this.geometryFrontierStats={plannedTiles:0,activeL3:0,excludedL3:0,selectedDetailNodes:0,rebuilds:0},this.activeTextureJobs=0,this.instantiateQueue=[],this.activeWorkerCount=0,this.recentlyUpgradedTextures=[],this.loaderHidden=!1,this.appStartTime=performance.now(),this.materialsToUpdate=new Set,this.gradientMode=1,this.heightFactor=0,this.transSettings={flatThresh:5,riseStart:6,riseEnd:25,curve:1},this.worldOrigin={x:0,y:0},this.floorMode=cx,this.floorState={locked:!1,provisional:!1,value:0},this.visibilityBootstrapReady=!1,this.globalStats={min:1/0,max:-1/0,avgSum:0,baseSum:0,count:0},this.frustum=new Oi,this.projScreenMatrix=new tt,this.atmosphereSettings={hazeDistance:kh},this.fpsState={lastSample:performance.now(),frames:0},this.fpsEl=document.getElementById("fps-counter"),this.hexCountEl=document.getElementById("hex-count"),this.tileHeightEl=document.getElementById("tile-height"),this.cameraHeightEl=document.getElementById("camera-height"),this.statsUpdateState={lastUpdate:0,interval:500},this.wasMovingView=!1,this.engineState=gs.STATIC,this._perfViolationCount=0,this._perfStats={},this._texErrorCount=0,this._frameCounter=0,this.frametimeCanvas=document.getElementById("frametime-graph"),this.frametimeCtx=this.frametimeCanvas?this.frametimeCanvas.getContext("2d"):null,this.frametimeBuffer=new Array(640).fill(16.67),this.frametimeLastTime=performance.now(),this.lodPaused=!1,this.initDebugConsole(),this.initMinimizeButton(),this.initCollapsibleSections(),this.initLODSliders(),this.updateFogAndClip(),this.workers=[],this.nextWorkerIdx=0,this.pendingJobs=new Map,this.jobIdCounter=0,this.textureSupport=null,this.initWorkers(),this.texStats={count:0,totalTranscodeMs:0,maxTranscodeMs:0,formatKey:null,totalGpuBytes:0,maxTextureSize:this.renderer.capabilities.maxTextureSize,highUploadSize:null,highSourceSize:null,highSkippedTopMips:0},this._textureMilestonesDone=!1,this._updateTexBadge(),this.vramLedger=new Ir,this.cacheManager=new Lr,this.profiler=new Dr(this),this.initTouchMomentumTracking(),this.initWorld(),this.animate(),window.pistonViewer=this}initTouchMomentumTracking(){let e=this.renderer?.domElement;if(!e)return;this.controls&&this.controls.touches&&(this.controls.touches.TWO=null),this.activeTouches=new Map,this.lastTouchDistance=null,this.lastTouchAngle=null,this.lastTouchMidpointY=null;let t=r=>{r.pointerType==="touch"&&(this.activeTouches.set(r.pointerId,{x:r.clientX,y:r.clientY}),this.activeTouches.size===2&&(this.lastTouchDistance=null,this.lastTouchAngle=null,this.lastTouchMidpointY=null))},n=r=>{r.pointerType==="touch"&&this.activeTouches.has(r.pointerId)&&(this.activeTouches.set(r.pointerId,{x:r.clientX,y:r.clientY}),this.activeTouches.size===2&&(r.cancelable&&r.preventDefault(),this.handleTwoFingerGesture(r)))},s=r=>{r.pointerType==="touch"&&(this.activeTouches.delete(r.pointerId),this.activeTouches.size<2&&(this.lastTouchDistance=null,this.lastTouchAngle=null,this.lastTouchMidpointY=null))};e.addEventListener("pointerdown",t,{passive:!0}),e.addEventListener("pointermove",n,{passive:!1}),e.addEventListener("pointerup",s,{passive:!0}),e.addEventListener("pointercancel",s,{passive:!0}),e.addEventListener("lostpointercapture",s,{passive:!0})}handleTwoFingerGesture(e){let t=Array.from(this.activeTouches.keys());if(t.length!==2)return;let n=t[0],s=t[1],r=this.activeTouches.get(n),a=this.activeTouches.get(s),o=Math.hypot(a.x-r.x,a.y-r.y),l=Math.atan2(a.y-r.y,a.x-r.x),c=(r.x+a.x)/2,h=(r.y+a.y)/2;if(this.lastTouchDistance===void 0||this.lastTouchDistance===null){this.lastTouchDistance=o,this.lastTouchAngle=l,this.lastTouchMidpointY=h;return}let u=o/this.lastTouchDistance,d=l-this.lastTouchAngle;for(;d<-Math.PI;)d+=Math.PI*2;for(;d>Math.PI;)d-=Math.PI*2;let m=h-this.lastTouchMidpointY,g=this.camera,x=this.controls.target,f=!1,p=c/this.renderer.domElement.clientWidth*2-1,y=-(h/this.renderer.domElement.clientHeight)*2+1,_=new _r;_.setFromCamera(new Te(p,y),g);let b=new Ft(new L(0,1,0),-x.y),S=new L;if(_.ray.intersectPlane(b,S)||S.copy(x),u!==1&&isFinite(u)&&Math.abs(u-1)>.001){let R=g.position.distanceTo(x),w=R/u;w=Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,w));let N=R/w;g.position.sub(S).divideScalar(N).add(S),x.sub(S).divideScalar(N).add(S),f=!0}if(d!==0&&isFinite(d)&&Math.abs(d)>.001){let R=this.controls.up||new L(0,1,0),w=new Ht().setFromAxisAngle(R,d);g.position.sub(S).applyQuaternion(w).add(S),x.sub(S).applyQuaternion(w).add(S),f=!0}if(m!==0&&isFinite(m)&&Math.abs(m)>.1){let R=Math.PI/this.renderer.domElement.clientHeight,w=m*R,N=new oi().setFromVector3(g.position.clone().sub(x));N.phi-=w;let M=this.controls.minPolarAngle!==void 0?this.controls.minPolarAngle:0,T=this.controls.maxPolarAngle!==void 0?this.controls.maxPolarAngle:Math.PI;N.phi=Math.max(M,Math.min(T,N.phi)),N.makeSafe(),g.position.copy(x).add(new L().setFromSpherical(N)),f=!0}f&&(g.lookAt(x),this.controls.update(),this.needsRender=!0,this.notifyCameraMotion(performance.now())),this.lastTouchDistance=o,this.lastTouchAngle=l,this.lastTouchMidpointY=h}initWorkers(){let e=Math.min(6,Math.max(2,navigator.hardwareConcurrency||4)),t=this.renderer.extensions;this.textureSupport={astc:t.has("WEBGL_compressed_texture_astc"),bptc:t.has("EXT_texture_compression_bptc"),s3tc:t.has("WEBGL_compressed_texture_s3tc"),etc2:t.has("WEBGL_compressed_texture_etc"),etc1:t.has("WEBGL_compressed_texture_etc1"),pvrtc:t.has("WEBGL_compressed_texture_pvrtc")||t.has("WEBKIT_WEBGL_compressed_texture_pvrtc"),maxTextureSize:this.renderer.capabilities.maxTextureSize};for(let n=0;n<e;n++){let s=new Worker(nx);s.onmessage=r=>this.handleWorkerMessage(r),s.postMessage({type:"INIT",data:{support:this.textureSupport}}),this.workers.push(s)}}handleWorkerMessage(e){let{id:t,status:n,result:s,error:r}=e.data,a=this.pendingJobs.get(t);a&&(this.pendingJobs.delete(t),n==="success"?a.resolve(s):a.reject(new Error(r)))}postWorkerJob(e,t,n=[]){return new Promise((s,r)=>{let a=this.jobIdCounter++;this.pendingJobs.set(a,{resolve:s,reject:r});let o=this.workers[this.nextWorkerIdx];this.nextWorkerIdx=(this.nextWorkerIdx+1)%this.workers.length,o.postMessage({id:a,type:e,data:t},n)})}log(e,t="info"){let n=document.getElementById("console-output");if(!n)return;let s=document.createElement("div");s.className=`log-line ${t}`,s.textContent=`[${new Date().toLocaleTimeString()}] ${e}`,n.appendChild(s),n.scrollTop=n.scrollHeight}initDebugConsole(){this.log("PistonViewer Initialized.","success")}initMinimizeButton(){let e=document.getElementById("minimize-btn"),t=document.getElementById("main-panel");e&&t&&e.addEventListener("click",()=>{t.classList.toggle("minimized"),e.textContent=t.classList.contains("minimized")?"+":"\u2212"})}initCollapsibleSections(){document.querySelectorAll(".collapsible-header").forEach(e=>{e.addEventListener("click",()=>{e.parentElement.classList.toggle("collapsed")})})}initLODSliders(){let e=document.getElementById("haze-distance-slider"),t=document.getElementById("haze-distance-val");e&&(e.value=this.atmosphereSettings.hazeDistance/1e3,t&&(t.textContent=this.atmosphereSettings.hazeDistance/1e3+"km"),e.addEventListener("input",()=>{this.atmosphereSettings.hazeDistance=parseInt(e.value)*1e3,t&&(t.textContent=e.value+"km"),this.updateFogAndClip()}));let n=document.getElementById("tex-upgrade-slider"),s=document.getElementById("tex-upgrade-val");n&&(n.min="128",n.max="2048",n.step="64",n.value=Pt.highEnterPx,s&&(s.textContent=Pt.highEnterPx+"px"),n.addEventListener("input",()=>{this.highTextureEnterPx=parseInt(n.value,10),s&&(s.textContent=this.highTextureEnterPx+"px"),this.needsLODUpdate=!0}));let r=document.getElementById("gradient-terrain"),a=document.getElementById("gradient-slope");r&&a&&(r.addEventListener("click",()=>{this.gradientMode=0,r.classList.add("active"),a.classList.remove("active"),r.style.background="#74b9ff",r.style.color="#fff",a.style.background="transparent",a.style.color="#ccc"}),a.addEventListener("click",()=>{this.gradientMode=1,a.classList.add("active"),r.classList.remove("active"),a.style.background="#74b9ff",a.style.color="#fff",r.style.background="transparent",r.style.color="#ccc"}));let o=document.getElementById("lod-pause-toggle");o&&o.addEventListener("change",l=>{mh(this,l.target.checked),this.log(this.lodPaused?"LOD Updates PAUSED":"LOD Updates RESUMED","info")})}computeLodRadii(){this.lodRadii.set(this.settledLodRadii)}updateLevelVisibility(e){for(let t of this.tiles.values())this._applyTileLevelVisibility(t,e)}_applyTileLevelVisibility(e,t){let n=this.camera.position.x,s=this.camera.position.y,r=this.camera.position.z,a=this.lodRadii,o=e.mesh;if(!o)return;let l=ph(this.isMovingView,e.geometryAwaitingFinal);for(let b of o.children){let S=b.userData.gosperLevel;if(S!==void 0){for(let R of b.children)R.material?.userData&&(R.material.userData.forceMovingMode=l);if(S>=1&&b.children[1]&&(b.children[1].visible=!l),l){let R=S===this.movingLevel;b.visible!==R&&(b.visible=R)}}}if(l)return;let c=((e.stats?.avg??this.floorState.value)-this.floorState.value)*t,h=e.stats?Math.max(Math.abs(e.stats.avg-e.stats.min),Math.abs(e.stats.max-e.stats.avg))*t:0,u=this.visibilityAdapter?.horizontalRadiusByLevel?.[dn]||551,d=Math.max(this.lodTileMargin,Math.hypot(u,h)+16),m=e.lx-n,g=c-s,x=e.lz-r,f=Math.sqrt(m*m+g*g+x*x),p=f-d,y=f+d,_=e.finestBuilt??0;for(let b of o.children){let S=b.userData.gosperLevel;if(S===void 0)continue;let R;if(S>=dn)R=!0;else{let w=S<=_||S<=0?0:a[S-1],N=a[S];R=p<N&&y>w}b.visible!==R&&(b.visible=R)}}createHexGeometry(e){let t=new xr(e,6);t.rotateX(-Math.PI/2);let n=t.attributes.position.count;t.setAttribute("aSideId",new bt(new Float32Array(n).fill(0),1));let s=r=>{let a=[],o=[],l=[],c=0;for(let u=0;u<r;u++){let d=u*Math.PI/3,m=(u+1)*Math.PI/3,g=Math.cos(d)*e,x=Math.sin(d)*e,f=Math.cos(m)*e,p=Math.sin(m)*e;a.push(g,0,x),a.push(f,0,p),a.push(g,-1,x),a.push(f,-1,p),o.push(c+2,c+1,c+0),o.push(c+2,c+3,c+1);for(let y=0;y<4;y++)l.push(u%3);c+=4}let h=new ln;return h.setAttribute("position",new bt(a,3)),h.setAttribute("aSideId",new bt(l,1)),h.setIndex(o),h.computeVertexNormals(),h};return{capGeo:t,unitSkirtGeo:s(3),aggregateSkirtGeo:s(6)}}onResize(){this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix(),this.renderer.setSize(window.innerWidth,window.innerHeight),this.needsLODUpdate=!0,this.needsRender=!0}updateFogAndClip(){let e=this.atmosphereSettings.hazeDistance,t=e,n=e*.6;this.isMiniBake?this.scene.fog=null:(this.scene.fog||(this.scene.fog=new fr(657930,n,t)),this.scene.fog.near=n,this.scene.fog.far=t),this.camera.far=Math.max(e+2e3,Da+5e3),this.camera.updateProjectionMatrix(),this.horizonMesh?.material?.userData?.shader&&this.horizonMesh.material.userData.shader.uniforms.uHazeRange.value.set(e*.8,Da)}async initWorld(){try{let e=await fetch(La("tile_manifest.json",Kr),{cache:"no-store"});if(this.manifest=await e.json(),this.manifest.type!=="gosper_l5")throw new Error(`Manifest type '${this.manifest.type}' is not gosper_l5 \u2014 re-run the baker`);let t=this.manifest.texture_pages,n=new Set(["xuastc-ldr-4x4","xuastc-ldr-6x6","xuastc-ldr-8x6"]);if(!t||t.container!=="ktx2"||!n.has(t.codec))throw new Error("Manifest needs the global XUASTC KTX2 texture-page contract");let s=t.encoding_profile?.tiers||{};if(t.encoding_profile){for(let y of["low","medium","high"])if(s[y]?.codec!==t.codec)throw new Error(`Manifest texture encoding profile is missing ${y} settings`)}else{if(t.codec!=="xuastc-ldr-6x6")throw new Error("Only the migration-era 6x6 manifest may omit encoding-profile settings");console.warn("[HEXAGONS] Legacy 6x6 texture manifest; rebake to record an encoding profile.")}let r={low:128,medium:256,high:4096},a=Object.fromEntries((t.tiers||[]).map(y=>[y.name,y.size_px]));for(let[y,_]of Object.entries(r))if(a[y]!==_)throw new Error(`Manifest texture tier ${y} must be ${_}px`);this.profiler?.milestone("manifestLoaded"),this.textureContract=t,this.binaryContract=this.manifest.binary||{};let o=new Set(this.binaryContract.supported_versions||[1,2]),l=Math.max(this.manifest.bounds.max_x-this.manifest.bounds.min_x,this.manifest.bounds.max_y-this.manifest.bounds.min_y);this.isMiniBake=l<=3e4;let c=document.getElementById("haze-distance-control");c&&(c.hidden=this.isMiniBake),this.updateFogAndClip();let{min_x:h,min_y:u}=this.manifest.bounds;if(this.worldOrigin={x:h,y:u},this.texturePageGrid=new Yr(t,{expectedCrs:"EPSG:31254"}),this.texturePageGrid.crs!=="EPSG:31254"||this.texturePageGrid.pageSize!==1024)throw new Error("Texture pages must use the EPSG:31254 global 1024m grid");if(this.renderer.capabilities.maxTextures<9)throw new Error(`Global texture pages need ${9} fragment samplers; device exposes ${this.renderer.capabilities.maxTextures}`);this.texturePageResidency=new qr({pages:this.texturePageGrid.pages,mini:this.isMiniBake,mediumEnterPx:Pt.mediumEnterPx,mediumExitPx:Pt.mediumExitPx,highEnterPx:Pt.highEnterPx}),this.textureStates=this.texturePageResidency.states,this.texturePageVisibilityAdapter=new Zr({pages:this.texturePageGrid.pages,worldOrigin:this.worldOrigin}),this.geometryPageFootprint=Bh(this.manifest.geometry,Fh(wn,{capOverscan:Ta})),this.manifestGrid=new Map;for(let y of this.manifest.tiles){if(y.gspVersion=Number(y.gspVersion??this.binaryContract.default_version??1),!o.has(y.gspVersion))throw new Error(`Manifest tile ${y.yq}_${y.yr} uses unsupported GSP${y.gspVersion}`);y.lx=y.x-this.worldOrigin.x,y.lz=-(y.y-this.worldOrigin.y);let _=`${y.yq}_${y.yr}`;this.manifestGrid.set(_,y);let b=this.texturePageGrid.pagesForBounds(Oh(y.x,y.y,this.geometryPageFootprint),{includeMissing:!0,maxPages:9});y.texturePageKeys=b.map(S=>S.key),this.texturePageResidency.attachConsumer(_,b.filter(S=>S.available).map(S=>S.key))}this.visibilityAdapter=new kr({manifest:this.manifest,worldOrigin:this.worldOrigin});let d=wn.offsets(dn);this.unitIndexMap=new Map;for(let y=0;y<d.length/2;y++)this.unitIndexMap.set(d[y*2]+128<<8|d[y*2+1]+128,y);let m=[{x:59817.9,y:206666.2},{x:95855.9,y:222423.2}],g=null,x=null;for(let y of m){let _=this.nearestManifestTile(y.x,y.y);if(_&&Math.hypot(_.x-y.x,_.y-y.y)<2e3){g=y.x-this.worldOrigin.x,x=-(y.y-this.worldOrigin.y);break}}if(g===null){let y=(this.manifest.bounds.min_x+this.manifest.bounds.max_x)*.5,_=(this.manifest.bounds.min_y+this.manifest.bounds.max_y)*.5;g=y-this.worldOrigin.x,x=-(_-this.worldOrigin.y)}this.camera.position.set(g,1200,x),this.controls.target.set(g,0,x),this.bootstrapVisibilityFloor(this.controls.target),this.notifyCameraMotion(performance.now()),this.controls.update(),this.syncHeightFactorFromControls(),await this.viewState.restoreFromUrl(),this.bootstrapVisibilityFloor(this.controls.target),this.syncHeightFactorFromControls(),this.visibilityBootstrapReady=!0,this.lastVisibilityCameraPosition=this.camera.position.clone();let f=Na/Math.sqrt(3),p=this.createHexGeometry(f);this.capGeometry=p.capGeo,this.unitSkirtGeometry=p.unitSkirtGeo,this.aggregateSkirtGeometry=p.aggregateSkirtGeo,this.essentialTilesTarget=1,this.buildHorizon(),this.updateLOD()}catch(e){console.error("Manifest error: "+e.message),this.log("Manifest error: "+e.message,"error")}}nearestManifestTile(e,t){let n=null,s=1/0;for(let r of this.manifest.tiles){let a=(r.x-e)**2+(r.y-t)**2;a<s&&(s=a,n=r)}return n}bootstrapVisibilityFloor(e=this.controls?.target){if(!this.manifest?.tiles||this.floorState.locked||this.tiles.size>0)return!1;let t=xh(this.manifest.tiles,e);return Number.isFinite(t)?(this.floorState.value=t,this.floorState.provisional=!0,!0):!1}syncHeightFactorFromControls(e=this.controls.getPolarAngle()*180/Math.PI){return this.heightFactor=Math.min(1,Math.max(0,(e-5.5)/(25-5.5))),this.heightFactor}buildHorizon(){let e=this.manifest.tiles;if(!e.length)return;let t=this.capGeometry.clone(),n=e.length,s=new Float32Array(n),r=new Float32Array(n),a=wn.levelXZ(dn);this.horizonIndex=new Map,this._horizonMat4=new tt;let o=new ni({color:16777215});o.fog=!1,o.customProgramCacheKey=()=>"piston_horizon_v1",o.onBeforeCompile=S=>{o.userData.shader=S,S.uniforms.uHeightFactor={value:0},S.uniforms.uFloorOffset={value:0},S.uniforms.uCameraPos={value:new L},S.uniforms.uHazeColor={value:new Xe(657930)},S.uniforms.uHazeRange={value:new Te(kh*.8,Da)},S.vertexShader=S.vertexShader.replace("#include <common>",`
                #include <common>
                uniform float uHeightFactor;
                uniform float uFloorOffset;
                attribute float instanceH;
                attribute float instanceShade;
                varying float vH;
                varying float vShade;
                varying vec3 vWorldPosH;
            `).replace("#include <begin_vertex>",`
                #include <begin_vertex>
                transformed.y += (instanceH - uFloorOffset) * uHeightFactor;
                vH = instanceH;
                vShade = instanceShade;
                #ifdef USE_INSTANCING
                    vWorldPosH = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
                #else
                    vWorldPosH = (modelMatrix * vec4(transformed, 1.0)).xyz;
                #endif
            `),S.fragmentShader=S.fragmentShader.replace("#include <common>",`
                #include <common>
                uniform vec3 uCameraPos;
                uniform vec3 uHazeColor;
                uniform vec2 uHazeRange;
                varying float vH;
                varying float vShade;
                varying vec3 vWorldPosH;
            `).replace("#include <color_fragment>",`
                #include <color_fragment>
                // Hypsometric tint x baked lambert, hazed toward the sky with
                // distance but never fully erased (mountains stay silhouetted).
                vec3 lowC = vec3(0.16, 0.22, 0.16);
                vec3 highC = vec3(0.42, 0.44, 0.47);
                vec3 terrain = mix(lowC, highC, clamp((vH - 800.0) / 2600.0, 0.0, 1.0)) * (0.55 + 0.45 * vShade);
                float haze = smoothstep(uHazeRange.x, uHazeRange.y, distance(vWorldPosH, uCameraPos)) * 0.85;
                diffuseColor.rgb = mix(terrain, uHazeColor, haze);
            `)};let l=new ii(t,o,n),c=new tt;e.forEach((S,R)=>{c.set(a.a,0,a.b,S.lx,0,1,0,0,a.c,0,a.d,S.lz,0,0,0,1),l.setMatrixAt(R,c),s[R]=S.hMean;let w=(S.nx-128)/127,N=(S.nz-128)/127,M=Math.sqrt(Math.max(0,1-w*w-N*N));r[R]=Math.max(0,w*-.35+M*.85+N*-.4),this.horizonIndex.set(`${S.yq}_${S.yr}`,R)}),t.setAttribute("instanceH",new mt(s,1)),t.setAttribute("instanceShade",new mt(r,1)),l.frustumCulled=!1,l.instanceMatrix.needsUpdate=!0,l.userData.gosperLevel=dn,l.userData.isSettledHorizon=!0,this.horizonMesh=l,this.materialsToUpdate.add(o),o.userData.isHorizon=!0,this.scene.add(l);let h=this.movingLevel,u=Math.pow(7,dn-h),d=Math.pow(7,h),m=wn.offsets(dn),g=[];for(let S=0;S<u;S++){let R=S*d,w=m[R*2],N=m[R*2+1],[M,T]=wn.axialToWorld(w,N);g.push({x:M,z:-T})}this.movingHorizonLocalXZ=g,this.movingHorizonChildrenPerTile=u,this.movingHorizonIndex=new Map;let x=n*u,f=this.capGeometry.clone(),p=new Float32Array(x),y=new Float32Array(x),_=new ii(f,o,x),b=0;e.forEach(S=>{this.movingHorizonIndex.set(`${S.yq}_${S.yr}`,b);for(let R=0;R<u;R++,b++)this._writeMovingHorizonMatrix(_,b,S,R,!1),p[b]=S.hMean,y[b]=r[this.horizonIndex.get(`${S.yq}_${S.yr}`)]}),f.setAttribute("instanceH",new mt(p,1)),f.setAttribute("instanceShade",new mt(y,1)),_.frustumCulled=!1,_.instanceMatrix.setUsage(bc),_.instanceMatrix.needsUpdate=!0,_.visible=!1,_.userData.gosperLevel=h,_.userData.isMovingHorizon=!0,this.movingHorizonMesh=_,this.scene.add(_)}_writeMovingHorizonMatrix(e,t,n,s,r){let a=this._horizonMat4;if(r)a.makeScale(0,0,0);else{let o=wn.levelXZ(this.movingLevel),l=this.movingHorizonLocalXZ[s];a.set(o.a,0,o.b,n.lx+l.x,0,1,0,0,o.c,0,o.d,n.lz+l.z,0,0,0,1)}e.setMatrixAt(t,a)}setHorizonTileHidden(e,t){if(!this.horizonMesh||!this.horizonIndex?.has(e))return;let n=this.horizonIndex.get(e),s=this.manifestGrid.get(e),r=this._horizonMat4;if(t)r.makeScale(0,0,0);else{let a=wn.levelXZ(dn);r.set(a.a,0,a.b,s.lx,0,1,0,0,a.c,0,a.d,s.lz,0,0,0,1)}if(this.horizonMesh.setMatrixAt(n,r),this.horizonMesh.instanceMatrix.needsUpdate=!0,this.movingHorizonMesh&&this.movingHorizonIndex?.has(e)){let a=this.movingHorizonIndex.get(e);for(let o=0;o<this.movingHorizonChildrenPerTile;o++)this._writeMovingHorizonMatrix(this.movingHorizonMesh,a+o,s,o,t);this.movingHorizonMesh.instanceMatrix.needsUpdate=!0}}createMissingPageTexture(){let e=new Uint8Array([255,0,255,255]),t=new mr(e,1,1,Ot);return t.minFilter=ot,t.magFilter=ot,t.generateMipmaps=!1,t.colorSpace=at,t.needsUpdate=!0,t.userData.isMissingTexturePage=!0,t}createTileMaterial(e){let t=new ni({map:this.missingPageTexture,side:Jt});return t.userData||(t.userData={}),t.userData.isClone=!0,t.userData.lodIdx=e,this.setupMaterialShader(t),t}createMeshFromWorkerData(e,t,n=!0){if(!e||e.matrix.length===0)return null;let s=e.matrix.length/16,r=this.capGeometry.clone(),a=e.level>=1?this.aggregateSkirtGeometry:this.unitSkirtGeometry,o=n?a.clone():null,l=new ii(r,t,s),c=o?new ii(o,t,s):null;l.frustumCulled=!1,c&&(c.frustumCulled=!1),l.instanceMatrix=new mt(e.matrix,16),c&&(c.instanceMatrix=new mt(e.matrix,16));let h=[l];c&&h.push(c),h.forEach(d=>{d.geometry.setAttribute("instanceNZ_1",new mt(e.nz1,4)),d.geometry.setAttribute("instanceNZ_2",new mt(e.nz2,4)),d.geometry.setAttribute("instanceSlopes",new mt(e.slopes,3)),d.geometry.setAttribute("instanceDeltas",new mt(e.deltas,3)),d.geometry.setAttribute("instanceNormal",new mt(e.norms,2)),d.geometry.setAttribute("aParentPos",new mt(e.parentPos,2)),d.geometry.setAttribute("aParentHeight",new mt(e.parentHeight,1))});let u=new Qt;return u.add(l),c&&u.add(c),u.userData.activeSkirts=c?e.activeSkirts:0,u.frustumCulled=!1,u}setupMaterialShader(e){e.customProgramCacheKey=()=>"piston_hex_global_pages_v4";let t=this.texturePageGrid.pageSize,n=this.worldOrigin,s=this.missingPageTexture,r=`
                #ifdef USE_MAP
                    // The fragment shader computes absolute source-grid UVs.
                    // A stable placeholder keeps Three's USE_MAP variant live.
                    vMapUv = vec2(0.5);
                #endif
                #include <project_vertex>
            `,a=Nh(9),o=a.declarations,c=`
                #ifdef USE_MAP
                    // Scene coordinates are rebased for float precision. Undo
                    // that rebase into absolute EPSG metres, then select one of
                    // up to nine explicitly bound pages. Half-open tests make exact
                    // east/north boundaries select only their next page.
                    vec2 sourceXY = vec2(
                        vWorldPos.x + uSourceOrigin.x,
                        uSourceOrigin.y - vWorldPos.z
                    );
                    vec4 texColor = vec4(1.0, 0.0, 1.0, 1.0);
                    bool sampledPage = false;
                    ${a.samplingBranches}
                    if (!sampledPage) texColor = vec4(1.0, 0.0, 1.0, 1.0);

                    float ao = 1.0 - (vSkirtY * 0.4);
                    float jitter = 1.0;
                    if (vIsTop < 0.5) jitter = 0.92 + (vSideId * 0.04);
                    float lighting = ao * jitter;
                    vec3 baseColor = texColor.rgb;
                    if (vIsTop < 0.5) {
                         if (uGradientMode > 0.5 && vSlope >= 30.0) {
                             baseColor = gradientColor(vSlope);
                         } else {
                             baseColor *= mix(0.6, 0.95, clamp(vInstDist / 3000.0, 0.0, 1.0));
                         }
                    }
                    vec3 finalColor = baseColor * lighting;
                    if (vIsTop > 0.5 && !gl_FrontFacing) {
                        // Radioactive green is a deliberate invariant alarm:
                        // it can only appear when the camera sees a cap from
                        // below. Keep it distinct from magenta missing pages.
                        finalColor = vec3(0.0, 1.0, 0.0);
                    }
                    diffuseColor = vec4(finalColor, 1.0);
                #endif
            `;e.onBeforeCompile=function(h){this.userData.shader=h,h.uniforms.uHeightFactor={value:0},h.uniforms.uGradientMode={value:1},h.uniforms.uFloorOffset={value:0},h.uniforms.uCameraPos={value:new L},h.uniforms.uLodRadii={value:new Te(0,1e9)},h.uniforms.uFinestBuilt={value:0};let u=this.userData.texturePageBindings||[];h.uniforms.uPageSize={value:t},h.uniforms.uSourceOrigin={value:new Te(n.x,n.y)};for(let d=0;d<9;d++){let m=u[d]||{};d>0&&(h.uniforms[`uPageMap${d}`]={value:m.texture||s}),h.uniforms[`uPageOrigin${d}`]={value:new Te(m.page?.minX||0,m.page?.minY||0)},h.uniforms[`uPageValid${d}`]={value:m.valid?1:0}}h.vertexShader=h.vertexShader.replace("#include <common>",`
                #include <common>
                uniform float uHeightFactor;
                uniform float uGradientMode; // Added for vertex shader access
                uniform float uFloorOffset;
                uniform vec3 uCameraPos;
                uniform vec2 uLodRadii;
                uniform float uFinestBuilt;

                attribute vec4 instanceNZ_1;
                attribute vec4 instanceNZ_2;

                // NEW: Vec3 for Slopes/Deltas, Vec2 for Normal
                attribute vec3 instanceSlopes;
                attribute vec3 instanceDeltas;
                attribute vec2 instanceNormal; // (Nx, Nz)
                attribute vec2 aParentPos;     // parent gosper node center, tile-local XZ
                attribute float aParentHeight; // parent representative source elevation (m)

                attribute float aSideId;

                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying float vSlope;
                varying float vIsTop;
                varying float vSkirtY;
                varying float vSideId;
                varying float vInstDist;
                varying vec3 vMyNormal;
            `).replace("#include <begin_vertex>",`
                #include <begin_vertex>

                float myH = instanceNZ_2.z - uFloorOffset;
                float animH = myH * uHeightFactor;

                // HIERARCHICAL CDLOD CUT (per-instance, evaluated on centers)
                // Draw this level-k node iff:
                //   selfDist  >  uLodRadii.x  (R(k-1): outside the finer fixed-distance band)
                //   parentDist <= uLodRadii.y (R(k): the parent must refine here)
                // The parent evaluates the identical distance value for its own
                // self-test, so parent/child regions partition exactly \u2014 no
                // holes and no double-draw at ring boundaries. uFinestBuilt
                // relaxes the self test while finer levels aren't built yet.
                #ifdef USE_INSTANCING
                    vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
                    // Instance matrices intentionally keep Y=0 because cap
                    // elevation is animated in the shader. LOD must measure to
                    // that visible representative height, not absolute Y=0;
                    // the latter makes a high camera choose coarse hexes even
                    // directly above nearby elevated terrain.
                    vec3 worldInstancePos = (modelMatrix * vec4(instancePos.x, animH, instancePos.z, 1.0)).xyz;
                    float instDist = distance(worldInstancePos, uCameraPos);
                    float parentAnimH = (aParentHeight - uFloorOffset) * uHeightFactor;
                    vec3 worldParentPos = (modelMatrix * vec4(aParentPos.x, parentAnimH, aParentPos.y, 1.0)).xyz;
                    float parentDist = distance(worldParentPos, uCameraPos);

                    bool selfCoarseEnough = (instDist > uLodRadii.x) || (uFinestBuilt > 0.5);
                    bool parentRefines = (parentDist <= uLodRadii.y);
                    if (!(selfCoarseEnough && parentRefines)) {
                        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                        return;
                    }
                    vInstDist = instDist;
                #else
                    vInstDist = 0.0;
                #endif

                bool isCap = (normal.y > 0.9);
                vIsTop = isCap ? 1.0 : 0.0;

                if (isCap) {
                    // CAP \u2014 always pure aerial texture. Slope-class colors
                    // live on SKIRTS only (owner directive: tops are never
                    // colored).
                    transformed.y = 0.0 + animH;
                    vSlope = 0.0;
                    vSkirtY = 0.0;
                    vSideId = -1.0;

                    // Decode Normal from [0, 1] -> [-1, 1]
                    float nx = instanceNormal.x * 2.0 - 1.0;
                    float nz = instanceNormal.y * 2.0 - 1.0;
                    float ny_sq = 1.0 - nx*nx - nz*nz;
                    float ny = sqrt(max(0.0, ny_sq));

                    vMyNormal = normalize(vec3(nx, ny, nz));

                } else {
                    // SKIRT
                    vSkirtY = -position.y; // 0 at top, 1 at bottom
                    vSideId = aSideId;

                    if (position.y > -0.1) {
                         transformed.y = animH;
                    } else {
                         // Select Delta based on Side ID (0=SE, 1=S, 2=SW)
                         float dVal = (aSideId < 0.5) ? instanceDeltas.x :
                                      (aSideId < 1.5) ? instanceDeltas.y : instanceDeltas.z;

                         // Fix: Convert Decimeters (Int16) to Meters (Float)
                         dVal *= 0.1;

                         // Distance-scaled extra drop: at LOD ring contours a
                         // neighbor may render at its subtree MEAN height,
                         // below the DEM height this skirt was baked against.
                         // Up to 12 m of slack beyond 1.2 km seals those
                         // steps; near skirts stay exactly DEM-deep.
                         dVal += clamp((vInstDist - 1200.0) / 3000.0, 0.0, 1.0) * 12.0;

                         transformed.y = animH - (dVal * uHeightFactor);
                    }

                    // Pick Slope for Gradient
                    float sVal = (aSideId < 0.5) ? instanceSlopes.x :
                                 (aSideId < 1.5) ? instanceSlopes.y : instanceSlopes.z;
                    vSlope = sVal;

                    vMyNormal = normal; // Skirt flat normal
                }

                #ifdef USE_INSTANCING
                    vLocalPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
                    vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
                #else
                    vLocalPos = transformed;
                    vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
                #endif
            `).replace("#include <project_vertex>",r),h.fragmentShader=h.fragmentShader.replace("#include <common>",`
                #include <common>
                uniform float uGradientMode;
                uniform vec3 uCameraPos;
                uniform vec2 uLodRadii;
                ${o}
                varying vec3 vLocalPos;
                varying vec3 vWorldPos;
                varying float vSlope;
                varying float vIsTop;
                varying float vSkirtY;
                varying float vSideId;
                varying float vInstDist;

                vec3 gradientColor(float s) {
                    // Green: 30-35
                    // Yellow: 35-40
                    // Orange: 40-45
                    // Red: 45-55
                    // Violet: > 55
                    
                    if (s < 30.0) return vec3(0.0); // Transparent/Texture?
                    if (s < 35.0) return vec3(0.2, 0.8, 0.2); // Green
                    if (s < 40.0) return vec3(0.9, 0.9, 0.2); // Yellow
                    if (s < 45.0) return vec3(1.0, 0.6, 0.0); // Orange
                    if (s < 55.0) return vec3(0.9, 0.2, 0.2); // Red
                    return vec3(0.6, 0.2, 0.8); // Violet
                }
            `).replace("#include <map_fragment>",c)},e.needsUpdate=!0}updateGlobalStats(e){e&&(this.globalStats.min=Math.min(this.globalStats.min,e.min),this.globalStats.max=Math.max(this.globalStats.max,e.max),this.globalStats.avgSum+=e.avg,this.globalStats.baseSum+=e.base,this.globalStats.count++)}updateRenderStats(e){if(e-this.statsUpdateState.lastUpdate<500)return;this.statsUpdateState.lastUpdate=e;let t=0,n=0;for(let r of this.tiles.values())r.mesh&&r.mesh.isGroup&&r.mesh.children.forEach(a=>{if(a.isGroup&&a.visible){let o=a.children[0],l=a.children[1];o&&o.visible&&(t+=o.count),l&&l.visible&&(n+=a.userData.activeSkirts||0)}});let s=document.getElementById("hex-count");s&&(s.innerHTML=`
                <span style="color: #00d2ff">${t.toLocaleString()} TOPS</span> | 
                <span style="color: #ff7675">${n.toLocaleString()} SKIRTS</span>
            `)}updateFps(){if(!this.fpsEl)return;let e=performance.now();this.fpsState.frames+=1;let t=e-this.fpsState.lastSample;if(t<500)return;let n=this.fpsState.frames*1e3/t,s=this.camera.position.distanceTo(this.controls.target);this.fpsEl.textContent=`FPS: ${n.toFixed(0)} | Zoom: ${s.toFixed(0)}`,this.fpsState.frames=0,this.fpsState.lastSample=e}updateFrametimeGraph(){if(!this.frametimeCtx)return;let e=performance.now(),t=e-this.frametimeLastTime;this.frametimeLastTime=e,this.frametimeBuffer.shift(),this.frametimeBuffer.push(t);let n=this.frametimeCtx,s=this.frametimeCanvas.width,r=this.frametimeCanvas.height;n.fillStyle="#0a0a0a",n.fillRect(0,0,s,r),n.strokeStyle="#222",n.lineWidth=1;let a=r-16.67/50*r;n.beginPath(),n.moveTo(0,a),n.lineTo(s,a),n.stroke();let o=r-33.33/50*r;n.beginPath(),n.moveTo(0,o),n.lineTo(s,o),n.stroke(),n.strokeStyle="#74b9ff",n.lineWidth=2,n.beginPath();for(let l=0;l<this.frametimeBuffer.length;l++){let c=Math.min(this.frametimeBuffer[l],50),h=l,u=r-c/50*r;l===0?n.moveTo(h,u):n.lineTo(h,u)}n.stroke(),n.fillStyle="#666",n.font="10px monospace",n.fillText("16.67ms (60fps)",5,a-3),n.fillText("33.33ms (30fps)",5,o-3)}_textureResourceKey(e){return typeof e=="string"?e:e?.key}_textureState(e){let t=this._textureResourceKey(e),n=this.texturePageResidency?.state(t);if(!n)throw new Error(`Unknown texture page ${t}`);return n}_textureUrls(e,t){let n=e===Ue.LOW?"low":e===Ue.MEDIUM?"medium":"high",s=this.texturePageGrid.urlFor(t,n);if(!s)throw new Error(`Texture page ${t} has no ${n} asset`);return[La(s,this.textureContract.cache_key)]}_desiredTextureTier(e,t,n){if(n==="outside")return Ue.LOW;let s=e.desiredTier||Ue.LOW,r=this.highTextureEnterPx||Pt.highEnterPx,a=r*.75;return n==="visible"&&(s===Ue.HIGH&&t>=a||t>=r)?Ue.HIGH:s!==Ue.LOW&&t>=Pt.mediumExitPx||t>=Pt.mediumEnterPx?Ue.MEDIUM:Ue.LOW}_queueTextureTier(e,t,n=0){if(!e)return;let s=this._textureState(e);if(!(s.assets.has(t)||s.loading.has(t))){if(s.queued.has(t)){let r=this.textureQueue.find(a=>a.key===s.key&&a.tier===t);r&&(r.priority=Math.max(r.priority,n));return}s.failed.has(t)||(s.queued.add(t),this.textureQueue.push({key:s.key,textureResource:e,tier:t,priority:n,urls:this._textureUrls(t,s.key)}))}}_scheduleTextureQuality(e,t,n,s=0,r=!1){let a=this._textureState(e);r||(a.classification=t,a.projectedDiameterPx=n,a.perceptibility=Number.isFinite(s)?s:0,a.desiredTier=this._desiredTextureTier(a,n,t)),this.cacheManager.updatePriority(a.key,a.perceptibility),this._queueTextureTier(e,Ue.LOW,s+1e3),Gi[a.desiredTier]>=Gi[Ue.MEDIUM]&&this._queueTextureTier(e,Ue.MEDIUM,s+500),a.desiredTier===Ue.HIGH&&!this.isMovingView&&this._queueTextureTier(e,Ue.HIGH,s),this._reconcileTextureState(a)}_bestTextureAsset(e,t=e.desiredTier,n=null){return this.texturePageResidency.bestAsset(e,t,n)}_texturePageSlots(e){if((e||[]).length>9)throw new RangeError(`geometry intersects ${e.length} pages; maximum is ${9}`);return(e||[]).map(t=>{let n=this.texturePageGrid.pageByKey.get(t);if(n)return n;let[s,r]=String(t).split("_").map(Number);return this.texturePageGrid.cell(s,r)})}_textureLedgerLocation(e){let t=(e.minX+e.maxX)*.5,n=(e.minY+e.maxY)*.5,s=(e.renderMin-this.floorState.value)*this.heightFactor,r=(e.renderMax-this.floorState.value)*this.heightFactor;return{kind:"texture-page",pageX:e.pageX,pageY:e.pageY,lx:t-this.worldOrigin.x,lz:-(n-this.worldOrigin.y),bounds:new Xt(new L(e.minX-this.worldOrigin.x,Math.min(s,r),-(e.maxY-this.worldOrigin.y)),new L(e.maxX-this.worldOrigin.x,Math.max(s,r),-(e.minY-this.worldOrigin.y)))}}_applyTexturePageBindings(e,t){if(!e)return;let n=this._texturePageSlots(t),s=[];for(let a=0;a<9;a++){let o=n[a]||null,l=o?.available?this.texturePageResidency.state(o.key):null,c=l?this._bestTextureAsset(l):null;l&&(l.activeTier=c?.[0]||null),s.push({page:o,texture:c?.[1]?.texture||this.missingPageTexture,valid:!!(o?.available&&c?.[1]?.texture),tier:c?.[0]||null})}e.userData.texturePageBindings=s,e.map=s[0]?.texture||this.missingPageTexture,e.color.setHex(16777215);let r=e.userData.shader;if(r){r.uniforms.map&&(r.uniforms.map.value=e.map);for(let a=0;a<9;a++){let o=s[a];a>0&&(r.uniforms[`uPageMap${a}`].value=o.texture),r.uniforms[`uPageOrigin${a}`].value.set(o.page?.minX||0,o.page?.minY||0),r.uniforms[`uPageValid${a}`].value=o.valid?1:0}}}_refreshTilePageTextures(e){if(!e)return;let t=new Set([e.material,...e.clonedMaterials||[]]);for(let r of t)this._applyTexturePageBindings(r,e.texturePageKeys);let n=e.texturePageKeys.filter(r=>this.texturePageResidency.state(r)),s=n.map(r=>{let a=this.texturePageResidency.state(r);return this._bestTextureAsset(a)?.[0]||null});e.textureTier=s.length>0&&s.every(Boolean)?s.reduce((r,a)=>Gi[a]<Gi[r]?a:r):null,e.isFullTex=s.length>0&&s.every(r=>r===Ue.HIGH);for(let r=0;r<n.length;r++)s[r]===Ue.HIGH&&this.cacheManager.touch(n[r]);this.needsRender=!0}_refreshTexturePageConsumers(e){for(let t of e.consumers){let n=this.tiles.get(t);n&&this._refreshTilePageTextures(n)}}_reconcileTextureState(e){let t=this._bestTextureAsset(e);t&&e.activeTier!==t[0]&&(e.activeTier=t[0],this._refreshTexturePageConsumers(e)),e.desiredTier!==Ue.HIGH&&e.assets.has(Ue.HIGH)&&this._dropTextureTier(e.key,Ue.HIGH),!this.isMiniBake&&e.classification==="outside"&&e.assets.has(Ue.MEDIUM)&&e.assets.has(Ue.LOW)&&this._dropTextureTier(e.key,Ue.MEDIUM)}_dropTextureTier(e,t,n=!1){let s=this.textureStates.get(e),r=s?.assets.get(t);if(!s||!r)return!0;let a=s.activeTier===t?this._bestTextureAsset(s,s.desiredTier,t):null;return this.texturePageResidency.dropAsset(e,t,a,{rebind:l=>this._refreshTexturePageConsumers(l),dispose:l=>l.texture.dispose()})?(this.vramLedger.removeTexture(e,t),t===Ue.HIGH&&!n&&this.cacheManager.removeHigh(e),!0):!1}_installTextureResult(e,t){let n=this._textureState(e.textureResource);n.loading.delete(e.tier),n.queued.delete(e.tier),n.failed.delete(e.tier);let s=this.buildCompressedTexture(t);if(e.tier===Ue.HIGH){if(!this.cacheManager.admitHigh(n.key,t.gpuBytes||0,o=>this._dropTextureTier(o,Ue.HIGH,!0),new Set(n.classification==="visible"?[n.key]:[]),n.perceptibility,o=>{let l=this.textureStates.get(o);return!!l&&(l.activeTier!==Ue.HIGH||!!this._bestTextureAsset(l,l.desiredTier,Ue.HIGH))})){s.dispose(),n.desiredTier=Ue.MEDIUM,this._reconcileTextureState(n);return}this.texStats.highUploadSize=t.width,this.texStats.highSourceSize=t.sourceWidth||t.width,this.texStats.highSkippedTopMips=t.skippedTopMips||0}let r={texture:s,bytes:t.gpuBytes||0,result:t};this.texturePageResidency.replaceAsset(n.key,e.tier,r,{rebind:a=>this._refreshTexturePageConsumers(a),dispose:a=>a.texture.dispose()}),this.vramLedger.setTexture(n.key,e.tier,t.gpuBytes||0,this._textureLedgerLocation(e.textureResource)),this._reconcileTextureState(n),this.updateTexStats(t),e.tier===Ue.HIGH&&this.recentlyUpgradedTextures.push({q:e.textureResource.pageX,r:e.textureResource.pageY,time:performance.now()})}processTextureResults(){let e=0;for(;e<Pt.maxUploadsPerFrame;){let t=this.textureResultQueue.findIndex(a=>!this.isMovingView||a.task.tier!==Ue.HIGH);if(t<0)break;let{task:n,result:s}=this.textureResultQueue.splice(t,1)[0],r=this._textureState(n.textureResource);if(n.tier===Ue.HIGH&&r.desiredTier!==Ue.HIGH){r.loading.delete(n.tier),r.queued.delete(n.tier);continue}this._installTextureResult(n,s),e++}}_dispatchTextureJobs(e){for(;this.activeWorkerCount<e&&this.activeTextureJobs<Pt.maxTextureJobs&&this.textureQueue.length>0;){let t=wh(this.textureQueue,this.textureStates,{isMoving:this.isMovingView,lowCoverageFirst:!0,lowCoverageIncludesOutside:this.isMiniBake});if(t<0)break;let n=this.textureQueue.splice(t,1)[0],s=this._textureState(n.textureResource);s.queued.delete(n.tier),!(!(this.isMiniBake&&n.tier===Ue.MEDIUM)&&Gi[n.tier]>Gi[s.desiredTier])&&(s.assets.has(n.tier)||s.loading.has(n.tier)||(s.loading.add(n.tier),this.activeWorkerCount++,this.activeTextureJobs++,this.postWorkerJob("LOAD_TEXTURE",{urls:n.urls}).then(a=>{a.networkBytes&&this.vramLedger.addNetworkPayload(n.key,{bin:0,tex:a.networkBytes}),this.textureResultQueue.push({task:n,result:a}),this.needsRender=!0}).catch(a=>{s.loading.delete(n.tier),s.failed.add(n.tier),this._texErrorCount++,this._updateTexBadge(),this._texErrorCount<=3&&console.warn(`[TEX_FAIL] ${n.key}/${n.tier}: ${a.message}`)}).finally(()=>{this.activeWorkerCount--,this.activeTextureJobs--,this.processQueues()})))}}_seedMiniTexturePins(){if(!this.isMiniBake||this.miniTexturePinsSeeded||!this.manifest)return;this.miniTexturePinsSeeded=!0;let e=this.texturePageGrid.pages;for(let t of e)this._queueTextureTier(t,Ue.LOW,-1e3);for(let t of e)this._queueTextureTier(t,Ue.MEDIUM,-2e3)}_planTileGeometry(e,{coarseOnly:t=!1}={}){let n=this.currentVisibilityContext;if(!n)throw new Error("geometry selection requires a current visibility context");let s=`${e.yq}_${e.yr}`,r=this.visibilityAdapter.getRootHandle(s);if(r===null)throw new Error(`missing visibility root for ${s}`);let a=Math.max(0,e.hMax-e.hMin),o=this.visibilityAdapter.horizontalRadiusByLevel[3],l=Math.max(this.lodTileMargin,Math.hypot(o,a)+24);return hh({adapter:this.visibilityAdapter,rootHandle:r,visibleFrustum:n.visibleFrustum,guardFrustum:n.guardFrustum,projection:n.projection,detailDistanceByDepth:[1/0,1/0,1/0,t?-1e30:this.settledLodRadii[2],t?-1e30:this.settledLodRadii[1],t?-1e30:this.settledLodRadii[0]],detailMarginMeters:l})}_updateTexturePageDemand({visibleFrustum:e,guardFrustum:t,projection:n}){let s=this.texturePageVisibilityAdapter,r=this.texturePageResidency;if(!s||!r)return;s.setVerticalTransform({factor:this.heightFactor,floor:this.floorState.value});let a=ds({hierarchy:s,visibleFrustum:e,guardFrustum:t,projection:n,maxDepth:0});this.texturePagePlanStats=a.stats,r.beginDemandPass();let o=(l,c)=>{for(let h=0;h<l.nodeIds.length;h++){let u=s.getPage(l.nodeIds[h]),d=l.projectedDiameterPx[h]||0,m=l.distanceMeters[h],g=l.viewDepthMeters[h],x=Number.isFinite(m)&&m>0?Math.max(0,Math.min(1,g/m)):1,f=Math.pow(x,8),p=Number.isFinite(d)?d*(.1+.9*f)*100:999999,y=(c==="visible"?1e9:c==="guard"?1e6:0)+Math.min(999999,p)-Math.min(99999,Number.isFinite(m)?m:99999);r.contribute(u,{classification:c,projectedDiameterPx:d,perceptibility:y})}};o(a.outside,"outside"),o(a.guard,"guard"),o(a.visible,"visible"),r.finishDemandPass({highEnterPx:this.highTextureEnterPx||Pt.highEnterPx}),this.textureQueue=Eh(this.textureQueue,r.states,{includeOutside:this.isMiniBake});for(let l of r.states.values()){if(l.assets.size>0&&this.vramLedger.updateTextureLocation(l.key,this._textureLedgerLocation(l.page)),!$r(l,{includeOutside:this.isMiniBake})){this.cacheManager.updatePriority(l.key,0),this._reconcileTextureState(l);continue}this._scheduleTextureQuality(l.page,l.classification,l.projectedDiameterPx,l.perceptibility,!0)}}updateLOD(){if(!this.visibilityAdapter||!this.visibilityBootstrapReady||this.lodPaused)return;this.camera.updateMatrixWorld(),this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);let e=eh(this.projScreenMatrix),t=this.lastVisibilityCameraPosition||this.camera.position,n=[(this.camera.position.x-t.x)*4,(this.camera.position.y-t.y)*4,(this.camera.position.z-t.z)*4],s=Math.max(300,Math.min(5e3,Math.abs(this.camera.position.y)*.25)),r=th(e,{marginMeters:s,predictedTranslation:n}),a=new L;this.camera.getWorldDirection(a);let o=new Te;this.renderer.getDrawingBufferSize(o);let l=nh({position:[this.camera.position.x,this.camera.position.y,this.camera.position.z],forward:[a.x,a.y,a.z],verticalFovRadians:br.degToRad(this.camera.fov),viewportHeightPx:o.y,near:this.camera.near});this.visibilityAdapter.setVerticalTransform({factor:this.heightFactor,floor:this.floorState.value}),this.currentVisibilityContext=Object.freeze({visibleFrustum:e,guardFrustum:r,projection:l}),this._updateTexturePageDemand({visibleFrustum:e,guardFrustum:r,projection:l});let c=ds({hierarchy:this.visibilityAdapter,visibleFrustum:e,guardFrustum:r,projection:l,maxDepth:0}),h=this.visibilityAdapter.summarizePlanByIsland(c);this.visibilityPlanStats={...c.stats,guardMarginMeters:s,viewportWidthPx:o.x,viewportHeightPx:o.y},this.lastVisibilityCameraPosition?this.lastVisibilityCameraPosition.copy(this.camera.position):this.lastVisibilityCameraPosition=this.camera.position.clone(),this.visibilityByKey.clear();let u=this.geometryFrontierStats?.rebuilds||0;this.geometryFrontierStats={plannedTiles:0,activeL3:0,excludedL3:0,selectedDetailNodes:0,rebuilds:u};for(let d=0;d<this.visibilityAdapter.islandCount;d++){let m=this.visibilityAdapter.getIslandKey(d),g=this.manifestGrid.get(m);if(!g)continue;let x=h.classification[d],f=x===hn.VISIBLE?"visible":x===hn.GUARD?"guard":"outside",p=h.projectedDiameterPx[d]||0,y=h.distanceMeters[d],_=h.viewDepthMeters[d],b=Number.isFinite(y)&&y>0?Math.max(0,Math.min(1,_/y)):1,S=Math.pow(b,8),R=Number.isFinite(p)?p*(.1+.9*S)*100:999999,w=(f==="visible"?1e9:f==="guard"?1e6:0)+Math.min(999999,R)-Math.min(99999,Number.isFinite(y)?y:99999),N={classification:f,projectedDiameterPx:p,distanceMeters:y,viewDepthMeters:_,centerWeight:S,priority:w};this.visibilityByKey.set(m,N);let M=this.tiles.get(m);if(M?.binaryVersion>=2&&f!=="outside"&&!this.isMovingView){let T=this._planTileGeometry(g);M.geometryDesiredSelection=T,M.geometryDesiredSignature=T.signature,this.geometryFrontierStats.plannedTiles++,this.geometryFrontierStats.activeL3+=T.activeL3Count,this.geometryFrontierStats.excludedL3+=T.excludedL3Count,this.geometryFrontierStats.selectedDetailNodes+=T.detailNodeCount,ch(M.geometrySelection,T)?(M.geometryAwaitingFinal=!0,this._queueGeometryRebuild(M,g,T,w)&&this.geometryFrontierStats.rebuilds++):M.geometryAwaitingFinal&&(M.geometryAwaitingFinal=!1,this.needsRender=!0)}f!=="outside"?!this.tiles.has(m)&&!this.loadingTiles.has(m)&&(this.loadingTiles.add(m),this.loadQueue.push({t:g,priority:w})):this.tiles.has(m)&&this.unloadTile(m)}this._seedMiniTexturePins(),this.processQueues(),this.checkInitialLoad()}checkInitialLoad(e){if(this.loaderHidden)return;let t=0;for(let n of this.tiles.values())n.mesh&&t++;t>=1&&(this.profiler?.milestone("firstTileOperational"),this.hideLoader())}_suppressHighTextureWorkForMotion(){this.textureQueue=this.textureQueue.filter(e=>e.tier!==Ue.HIGH?!0:(this.textureStates.get(e.key)?.queued.delete(Ue.HIGH),!1));for(let e of this.textureStates.values())e.queued.delete(Ue.HIGH)}notifyCameraMotion(e=performance.now()){let t=this.cameraMotion.enterMotion(e,this.isMovingView);return this.needsRender=!0,this.needsLODUpdate=!0,t?(this.isMovingView=!0,this._beginGeometryMode(!0),this._suppressHighTextureWorkForMotion(),!0):!1}_beginGeometryMode(e){this.geometryPlanEpoch++,this.geometryRebuildQueue.length=0;for(let t of this.tiles.values())t.geometryRebuildQueued=null,t.geometryRebuildNext=null,t.geometryDesiredSelection=null,t.geometryDesiredSignature=null,t.geometryAwaitingFinal=!e&&t.binaryVersion>=2;e&&(this.needsRender=!0)}_queueGeometryRebuild(e,t,n,s){let r={tile:e,manifestTile:t,selection:n,priority:s,epoch:this.geometryPlanEpoch,mode:this.isMovingView?"moving":"settled",signature:n.signature};if(e.geometryDesiredSelection=n,e.geometryDesiredSignature=n.signature,e.geometryRebuildPending){let a=e.geometryRebuildPending;return a.epoch===r.epoch&&a.mode===r.mode&&a.signature===r.signature?!1:(e.geometryRebuildNext=r,!0)}return e.geometryRebuildQueued?(Object.assign(e.geometryRebuildQueued,r,{priority:Math.max(e.geometryRebuildQueued.priority,s)}),!1):(e.geometryRebuildQueued=r,this.geometryRebuildQueue.push(r),!0)}_startGeometryRebuild(e){let{tile:t,manifestTile:n,selection:s}=e,r=`${n.yq}_${n.yr}`;return t.geometryRebuildQueued=null,this.tiles.get(r)!==t||!(t.geometrySource instanceof ArrayBuffer)||t.geometryRebuildPending||!Wr({taskEpoch:e.epoch,currentEpoch:this.geometryPlanEpoch,taskSignature:e.signature,desiredSignature:t.geometryDesiredSignature,taskMode:e.mode,isMovingView:this.isMovingView})?!1:(t.geometryRebuildPending=e,this.activeWorkerCount++,this.postWorkerJob("BUILD_GEOMETRY",{binBuffer:t.geometrySource,yq:n.yq,yr:n.yr,expectedGspVersion:t.binaryVersion,rangesByDepth:s.rangesByDepth}).then(a=>{if(this.tiles.get(r)===t){if(a.binaryVersion!==t.binaryVersion)throw new Error(`geometry rebuild version mismatch for ${r}`);Wr({taskEpoch:e.epoch,currentEpoch:this.geometryPlanEpoch,taskSignature:e.signature,desiredSignature:t.geometryDesiredSignature,taskMode:e.mode,isMovingView:this.isMovingView})&&this._replaceTileGeometry(t,a.lods,a.geometryBytes,s)}}).catch(a=>{console.error(`Geometry rebuild failed for ${r}`,a)}).finally(()=>{this.activeWorkerCount--,t.geometryRebuildPending===e&&(t.geometryRebuildPending=null);let a=t.geometryRebuildNext;t.geometryRebuildNext=null,a&&Wr({taskEpoch:a.epoch,currentEpoch:this.geometryPlanEpoch,taskSignature:a.signature,desiredSignature:t.geometryDesiredSignature,taskMode:a.mode,isMovingView:this.isMovingView})&&(t.geometryRebuildQueued=a,this.geometryRebuildQueue.push(a)),this.needsLODUpdate=!0,this.needsRender=!0,this.processQueues()}),!0)}_replaceTileGeometry(e,t,n,s){let r=new Qt,a={},o=[],l=Ra(this.isMovingView,e.binaryVersion);try{for(let g of l){let x=t[g];if(!x)continue;let f=e.material.clone();f.userData={...e.material.userData,lodIdx:g,shader:null},this.setupMaterialShader(f),this.materialsToUpdate.add(f),o.push(f);let p=this.createMeshFromWorkerData(x,f,!0);p&&(p.userData.activeSkirts=x.activeSkirts,p.userData.gosperLevel=g,g>=1&&p.children[1]&&(p.children[1].visible=!this.isMovingView),r.add(p),a[g]=!0)}let c=Object.keys(a).map(Number);if(c.length===0)throw new Error("filtered rebuild produced no coarse geometry");let h=Math.min(...c);r.position.copy(e.mesh.position);let u={...e,mesh:r,builtLevels:a,finestBuilt:h,geometrySelection:s,geometryAwaitingFinal:!1};this._markFinestBuilt(u),this.renderer.compile(r,this.camera),this._applyTileLevelVisibility(u,this.heightFactor);let d=e.mesh;e.container.add(r),e.container.remove(d);let m=new Set;d.traverse(g=>{if(!g.isMesh)return;g.geometry?.dispose();let x=Array.isArray(g.material)?g.material:[g.material];for(let f of x)!f||m.has(f)||(m.add(f),f.map&&(f.map=null),this.materialsToUpdate.delete(f),f.dispose())}),e.mesh=r,e.lods=t,e.builtLevels=a,e.finestBuilt=h,e.clonedMaterials=o,e.geometrySelection=s,e.geometryAwaitingFinal=!1,this.vramLedger.registerGeometry(`${e.yq}_${e.yr}`,{geometryBytes:n,q:e.yq,r:e.yr,lx:e.lx,lz:e.lz}),this.needsRender=!0}catch(c){r.traverse(h=>{h.isMesh&&h.geometry?.dispose()});for(let h of o)this.materialsToUpdate.delete(h),h.dispose();throw c}}processQueues(){let e=this.workers.length;for(this.geometryRebuildQueue.sort((t,n)=>n.priority-t.priority),this.loadQueue.sort((t,n)=>(n.priority||0)-(t.priority||0));this.activeWorkerCount<e&&(this.loadQueue.length>0||this.geometryRebuildQueue.length>0);){let t=this.geometryRebuildQueue[0],n=this.loadQueue[0];if(t&&(!n||t.priority>(n.priority||0))){this.geometryRebuildQueue.shift(),this._startGeometryRebuild(t);continue}let s=this.loadQueue.shift(),r=`${s.t.yq}_${s.t.yr}`;if(this.tiles.has(r)||this.visibilityByKey.get(r)?.classification==="outside"){this.loadingTiles.delete(r);continue}this.activeWorkerCount++,this.fetchTileOnWorker(s).then(a=>{this.activeWorkerCount--,a&&this.instantiateQueue.push(a),this.processQueues()})}this.loadQueue.length===0&&this.geometryRebuildQueue.length===0&&this._dispatchTextureJobs(e)}async fetchTileOnWorker(e){let t=`${e.t.yq}_${e.t.yr}`;try{let{t:n}=e,s=Number(n.gspVersion??this.binaryContract.default_version??1),r=this.binaryContract.cache_key??`${this.binaryContract.default_format||"GSP"}${this.binaryContract.default_version||s}`,a=La(`tiles_bin/gosper_${n.yq}_${n.yr}.bin`,`${r}-gsp${s}`),o=await this.postWorkerJob("LOAD_TILE",{yq:n.yq,yr:n.yr,binUrl:a,expectedGspVersion:s});if(o.binaryVersion!==s)throw new Error(`Binary cache mismatch for ${t}: manifest GSP${s}, parsed GSP${o.binaryVersion}`);if(o.binaryVersion>=2){if(!(o.geometrySource instanceof ArrayBuffer)||!o.visibilityData)throw new Error(`GSP2+ tile ${t} did not provide deferred geometry source/bounds`);this.visibilityAdapter.attachDecodedIsland(t,o.visibilityData);let l=this._planTileGeometry(n,{coarseOnly:this.isMovingView||this.visibilityByKey.get(t)?.classification==="outside"}),c=await this.postWorkerJob("BUILD_GEOMETRY",{binBuffer:o.geometrySource,yq:n.yq,yr:n.yr,expectedGspVersion:s,rangesByDepth:l.rangesByDepth});if(c.binaryVersion!==s)throw new Error(`deferred geometry version mismatch for ${t}`);o.lods=c.lods,o.geometryBytes=c.geometryBytes,o.geometrySelection=l}return{task:e,workerData:o}}catch(n){return console.error("Tile Fetch Error",n),this.visibilityAdapter?.detachDecodedIsland(t),this.loadingTiles.delete(`${e.t.yq}_${e.t.yr}`),null}}buildCompressedTexture(e){let{mipmaps:t,width:n,height:s,formatKey:r,isSRGB:a}=e,o=fx[r];if(!o)throw new Error(`Unknown compressed texture formatKey from worker: ${r}`);let l=new gr(t,n,s,o);return l.minFilter=t.length>1?ei:At,l.magFilter=At,l.generateMipmaps=!1,l.flipY=!1,l.colorSpace=a?at:en,l.needsUpdate=!0,l}updateTexStats(e){this.texStats.count++,this.texStats.totalTranscodeMs+=e.transcodeMs||0,this.texStats.maxTranscodeMs=Math.max(this.texStats.maxTranscodeMs,e.transcodeMs||0),this.texStats.formatKey=e.formatKey,this.texStats.totalGpuBytes+=e.gpuBytes||0,this._updateTexBadge()}_updateTexBadge(){if(!this._texBadgeEl){let o=document.createElement("div");o.id="tex-debug-badge",o.style.cssText=["position:fixed","bottom:max(8px,env(safe-area-inset-bottom))","left:max(8px,env(safe-area-inset-left))","max-width:calc(100vw - 16px)","background:rgba(7,20,34,0.82)","font:10px/1.35 'Courier New',monospace","font-variant-numeric:tabular-nums","padding:5px 7px","border-radius:6px","border:1px solid rgba(151,193,224,0.24)","box-shadow:0 2px 10px rgba(0,0,0,0.2)","z-index:9999","pointer-events:none","white-space:nowrap","display:grid","gap:2px"].join(";");let l=new Map;for(let c of kn){let h=document.createElement("div");h.className="tex-debug-row",h.dataset.tier=c.tier,h.dataset.sizePx=String(c.size),h.style.cssText=["display:grid","grid-template-columns:7px 68px auto","align-items:center","column-gap:5px"].join(";");let u=document.createElement("span");u.dataset.role="tier-swatch",u.style.cssText=["display:block","width:6px","height:6px","border-radius:50%",`background:${c.color}`,`box-shadow:0 0 5px ${c.color}`].join(";");let d=document.createElement("span");d.dataset.role="tier-label",d.style.cssText=`color:${c.color};font-weight:700`,d.textContent=`${c.label} ${c.size}px`;let m=document.createElement("span");m.dataset.role="tier-metrics",m.style.color="#d7e6f2",h.append(u,d,m),o.appendChild(h),l.set(c.tier,{row:h,metrics:m})}document.body.appendChild(o),this._texBadgeEl=o,this._texBadgeRows=l}let e=Ch(this.tiles,this.visibilityByKey),t=kn.some(({tier:o})=>e[o].size>0);if(!this._textureMilestonesDone&&t){this.profiler?.milestone("firstTexture"),(this.loadQueue?.length??0)===0&&(this.instantiateQueue?.length??0)===0&&Ph(this.tiles,this.visibilityByKey)===0&&this.profiler?.milestone("visibleTexturedCoverage");let l=this.profiler?.milestones||{};this._textureMilestonesDone=l.firstTexture!==void 0&&l.visibleTexturedCoverage!==void 0}let n=Ih(this.textureStates),s=kn.map(({tier:o})=>({tier:o,displayed:e[o].size,loaded:n.loaded[o],pending:n.pending[o],failed:n.failed[o]})),r=JSON.stringify([this.texStats.formatKey,s]);if(r===this._texBadgeSignature)return;this._texBadgeSignature=r;for(let o of s){let{row:l,metrics:c}=this._texBadgeRows.get(o.tier);l.dataset.displayed=String(o.displayed),l.dataset.loaded=String(o.loaded),l.dataset.pending=String(o.pending),l.dataset.failed=String(o.failed),c.textContent=`displayed ${o.displayed} \xB7 loaded ${o.loaded} \xB7 q/inflight ${o.pending} \xB7 fail ${o.failed}`,c.style.color=o.failed>0?"#ff9c9c":"#d7e6f2"}let a=this.texStats.formatKey||"loading";this._texBadgeEl.dataset.format=a,this._texBadgeEl.title=`Texture pages \xB7 ${a}`,this._texBadgeEl.setAttribute("aria-label",`Texture pages ${a}. ${s.map(o=>`${o.tier}: ${o.displayed} displayed, ${o.loaded} loaded, ${o.pending} queued or inflight, ${o.failed} failed`).join(". ")}`)}processInstantiationQueue(){if(this.instantiateQueue.length===0)return;let e=performance.now();for(;this.instantiateQueue.length>0;){let t=this.instantiateQueue.shift();if(xs("instantiateTile",()=>this.instantiateTile(t.task,t.workerData)),performance.now()-e>2)break}}instantiateTile(e,t){let{t:n}=e,s=`${n.yq}_${n.yr}`;if(!this.tiles.has(s)){if(t.networkBytes&&this.vramLedger.addNetworkPayload(s,t.networkBytes),this.visibilityByKey.get(s)?.classification==="outside"){this.visibilityAdapter?.detachDecodedIsland(s),this.loadingTiles.delete(s);return}try{if(!t.lods)throw new Error(`tile ${s} reached instantiation before deferred geometry was built`);t.visibilityData&&this.visibilityAdapter.attachDecodedIsland(s,t.visibilityData);let r=this.createTileMaterial(0);this._applyTexturePageBindings(r,n.texturePageKeys),this.materialsToUpdate.add(r);let a=new Qt,o=Ra(this.isMovingView,t.binaryVersion),l={};for(let y of o){let _=t.lods[y];if(!_)continue;let b=r.clone();b.userData={...r.userData},b.userData.lodIdx=y,b.userData.shader=null,this.setupMaterialShader(b),this.materialsToUpdate.add(b);let S=this.createMeshFromWorkerData(_,b,!0);S&&(S.userData.activeSkirts=_.activeSkirts,S.userData.gosperLevel=y,y>=1&&S.children[1]&&(S.children[1].visible=!this.isMovingView),a.add(S),l[y]=!0)}let c=Object.keys(l).map(Number);if(c.length===0)throw new Error(`tile ${s} has no selected geometry`);let h=Math.min(...c),u=t.binaryVersion>=2&&this.isMovingView?this._planTileGeometry(n,{coarseOnly:!0}):t.geometrySelection||null;a.position.set(n.lx,0,n.lz);let d=new Qt;n.mesh=a,d.add(a),this.scene.add(d),this.renderer.compile(d,this.camera),d.visible=!0,this.needsRender=!0;let m=this.visibilityAdapter?.horizontalRadiusByLevel?.[dn]||551,g=new Xt(new L(n.lx-m,ux,n.lz-m),new L(n.lx+m,dx,n.lz+m)),x=[];d.traverse(y=>{y.isMesh&&y.material&&x.push(y.material)});let f={yq:n.yq,yr:n.yr,lx:n.lx,lz:n.lz,mesh:a,container:d,material:r,bounds:g,lods:t.lods,builtLevels:l,finestBuilt:h,unitHeights:t.unitHeights,stats:t.stats,center:t.center,binaryVersion:t.binaryVersion,geometrySelection:u,geometryDesiredSelection:null,geometryDesiredSignature:null,geometryRebuildPending:null,geometryRebuildQueued:null,geometryRebuildNext:null,geometryAwaitingFinal:!1,geometrySource:t.geometrySource||null,texturePageKeys:[...n.texturePageKeys],textureTier:null,isFullTex:!1,isTransitioning:!1,clonedMaterials:x};this._markFinestBuilt(f),this.tiles.set(s,f),f.binaryVersion>=2&&(this.needsLODUpdate=!0),this.setHorizonTileHidden(s,!0),this.updateGlobalStats(t.stats);let p=t.geometryBytes||0;this.vramLedger.registerGeometry(s,{geometryBytes:p,q:n.yq,r:n.yr,lx:n.lx,lz:n.lz}),this._refreshTilePageTextures(f),this.loadingTiles.delete(s)}catch(r){console.error("Instantiation Error",s,r),this.loadingTiles.delete(s),this.visibilityAdapter?.detachDecodedIsland(s)}}}_markFinestBuilt(e){e.mesh&&e.mesh.traverse(t=>{if(t.isMesh&&t.material?.userData){let n=t.material.userData;n.isFinest=n.lodIdx===e.finestBuilt}})}unloadTile(e){let t=this.tiles.get(e);t&&(this._disposeTileGPU(t),this.vramLedger.deregisterGeometry(e),this.tiles.delete(e),this.loadingTiles.delete(e),this.visibilityAdapter?.detachDecodedIsland(e),this.setHorizonTileHidden(e,!1))}_disposeTileGPU(e){e.container&&this.scene.remove(e.container),e.mesh&&e.mesh.traverse(t=>{if(t.isMesh){t.geometry&&t.geometry.dispose();let n=t.material?Array.isArray(t.material)?t.material:[t.material]:[];for(let s of n)s.map&&(s.map=null),this.materialsToUpdate.delete(s),s.dispose()}}),e.material&&(e.material.map&&(e.material.map=null),this.materialsToUpdate.delete(e.material),e.material.dispose()),e.clonedMaterials&&e.clonedMaterials.forEach(t=>{this.materialsToUpdate.delete(t),t.map&&(t.map=null),t.dispose()}),e.mesh=null,e.material=null,e.clonedMaterials=null,e.container=null,e.lods=null,e.unitHeights=null,e.geometrySource=null,e.geometrySelection=null}hideLoader(){if(this.loaderHidden)return;let e=performance.now()-this.appStartTime;if(e<900){setTimeout(()=>this.hideLoader(),900-e);return}this.loaderHidden=!0,this.profiler?.milestone("loaderHidden"),console.log(`[HEXAGONS] ${Kr} \u2014 ready in ${(e/1e3).toFixed(1)}s (${this.tiles.size} tiles)`);let t=document.getElementById("loader");t&&(t.classList.add("hide"),setTimeout(()=>{t.style.display="none"},600),this.searchBar=new Pr)}_setHudText(e,t){if(this._hudEls||(this._hudEls={},this._hudLast={}),this._hudLast[e]===t)return;let n=this._hudEls[e];n===void 0&&(n=this._hudEls[e]=document.getElementById(e)),n&&(n.textContent=t,this._hudLast[e]=t)}sampleTerrainSourceElevation(e,t){let n=e+this.worldOrigin.x,s=this.worldOrigin.y-t,r=lx(n,s),[a,o]=wn.tileOfUnit(r.q,r.r),l=`${a}_${o}`,c=this.tiles.get(l),h;if(c&&c.center&&c.unitHeights){let u=r.q-c.center.q,d=r.r-c.center.r,m=this.unitIndexMap.get(u+128<<8|d+128);h=m!==void 0?c.unitHeights[m]:void 0,h===void 0&&(h=c.stats?.avg)}else h=this.manifestGrid?.get(l)?.hMean;return{sourceElevation:h,wx:n,wy:s,axial:r,tq:a,tr:o}}maintainCameraAltitudeDuringAnimation(e){let t=this.controls.target,n=this.sampleTerrainSourceElevation(t.x,t.z);this._setHudText("sector-val",`${n.tq}, ${n.tr}`),this._setHudText("world-val",`${n.wx.toFixed(0)}, ${n.wy.toFixed(0)}`),this._setHudText("hex-val",`${n.axial.q}, ${n.axial.r}`);let s=n.sourceElevation;if(Number.isFinite(s)){let r=_h({cameraY:this.camera.position.y,targetY:t.y,sourceElevation:s,floor:this.floorState.value,factor:e});t.y=r.targetY,this.camera.position.y=r.cameraY;let a=this.sampleTerrainSourceElevation(this.camera.position.x,this.camera.position.z).sourceElevation,o=Number.isFinite(a)?Math.max(a,s):s,l=yh({cameraY:this.camera.position.y,sourceElevation:o,floor:this.floorState.value,factor:e,clearance:ax});this.camera.position.y=l.cameraY,this._setHudText("tile-height",`${r.terrainY.toFixed(1)}m`)}this._setHudText("camera-height",`${this.camera.position.y.toFixed(0)}m`)}updateFloorState(e){let t=this.pickFloorValue();Number.isFinite(t)&&(Vh&&e>hx?((!this.floorState.locked||t<this.floorState.value)&&(this.floorState.value=t),this.floorState.locked=!0,this.floorState.provisional=!1,this.updateFloorUniforms()):Vh?(this.floorState.value=t,this.floorState.provisional=!1,this.updateFloorUniforms()):(this.floorState.value=t,this.floorState.provisional=!1,this.updateFloorUniforms()))}pickFloorValue(){let e=this.getTilesInView(),t=e.length?e:Array.from(this.tiles.values()),n=1/0;for(let s of t)s.stats&&s.stats.min<n&&(n=s.stats.min);return Number.isFinite(n)?n:NaN}getTilesInView(){return this.camera.updateMatrixWorld(),this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projScreenMatrix),Array.from(this.tiles.values()).filter(e=>this.frustum.intersectsBox(e.bounds))}updateFloorUniforms(){for(let e of this.materialsToUpdate)e.userData.shader&&(e.userData.shader.uniforms.uFloorOffset.value=this.floorState.value)}deriveEngineState(e){if(this.isMovingView)return e?gs.MOVING_2D:gs.MOVING_3D;let t=this.recentlyUpgradedTextures.some(n=>performance.now()-n.time<100);return this.textureQueue.length>0||this.textureResultQueue.length>0||this.activeWorkerCount>0||t?gs.SINTERING:gs.STATIC}getDetailedStats(e="snapshot"){this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projScreenMatrix);let t=this.vramLedger.getSpatialBreakdown(this.frustum,this.camera.position,this.tiles),n=_=>_<1024?`${_} B`:_<1048576?`${(_/1024).toFixed(1)} KB`:_<1073741824?`${(_/1048576).toFixed(1)} MB`:`${(_/1073741824).toFixed(2)} GB`,s=0,r=0,a=0,o=0,l=0,c=0,h=0,u=0,d=0,m=0,g=0,x=0;for(let[_,b]of this.tiles){let R=(this.vramLedger.entries.get(_)?.geometryBytes||0)+this.vramLedger.textureBytesFor(_),w=this.visibilityByKey.get(_)?.classification||"outside",N=b.textureTier===Ue.HIGH;w==="visible"?(s++,o+=R,N?h++:u++):w==="guard"?(r++,l+=R,N?d++:m++):(a++,c+=R,N?g++:x++)}let f={low128:0,medium256:0,high4096:0},p={low128:0,medium256:0,high4096:0,none:0},y={low128:0,medium256:0,high4096:0};for(let _ of this.textureStates.values()){for(let b of _.assets.keys())f[b]++;_.activeTier?p[_.activeTier]++:p.none++,y[_.desiredTier]++}return{phase:e,timestamp:performance.now(),engineState:this.engineState,activeTileCount:this.tiles.size,tileClassification:{visible:{count:s,full:h,low:u,vram:n(o),bytes:o},buffer:{count:r,full:d,low:m,vram:n(l),bytes:l},vestigial:{count:a,full:g,low:x,vram:n(c),bytes:c}},vram:{geometryBytes:this.vramLedger.totalGeometryBytes,textureBytes:this.vramLedger.totalTextureBytes,totalBytes:this.vramLedger.totalVRAMBytes,highTextureBudgetBytes:this.cacheManager.budget,highTextureBytes:this.cacheManager.highBytes,highTextureBudgetUtilization:+this.cacheManager.utilization.toFixed(4),geometry:n(this.vramLedger.totalGeometryBytes),textures:n(this.vramLedger.totalTextureBytes),total:n(this.vramLedger.totalVRAMBytes),highTextureBudget:n(this.cacheManager.budget),highTextureHeadroom:n(this.cacheManager.headroom)},network:{totalPayloadBytes:this.vramLedger.totalNetworkBytes,binBytes:this.vramLedger._networkBin,texBytes:this.vramLedger._networkTex,total:n(this.vramLedger.totalNetworkBytes),bin:n(this.vramLedger._networkBin),tex:n(this.vramLedger._networkTex)},spatial:{inFrustumBytes:t.inFrustumBytes,outFrustumBytes:t.outFrustumBytes,nearBytes:t.nearBytes,midBytes:t.midBytes,farBytes:t.farBytes,inFrustumTiles:t.tileBreakdown.inFrustum,outFrustumTiles:t.tileBreakdown.outFrustum,inFrustumTexturePages:t.texturePageBreakdown.inFrustum,outFrustumTexturePages:t.texturePageBreakdown.outFrustum,inFrustumTextureAllocations:t.texturePageBreakdown.inFrustumAllocations,outFrustumTextureAllocations:t.texturePageBreakdown.outFrustumAllocations,geometryBytes:t.geometryBytes,texturePageBytes:t.textureBytes,inFrustum:`${t.tileBreakdown.inFrustum} geometry tiles + ${t.texturePageBreakdown.inFrustum} texture pages (${n(t.inFrustumBytes)})`,outFrustum:`${t.tileBreakdown.outFrustum} geometry tiles + ${t.texturePageBreakdown.outFrustum} texture pages (${n(t.outFrustumBytes)})`,near:n(t.nearBytes),mid:n(t.midBytes),far:n(t.farBytes)},tiles:{loaded:this.tiles.size,loadQueue:this.loadQueue.length,textureQueue:this.textureQueue.length,textureResultQueue:this.textureResultQueue.length,geometryRebuildQueue:this.geometryRebuildQueue.length,activeWorkers:this.activeWorkerCount,materialsTracked:this.materialsToUpdate.size,evictedTotal:this.cacheManager.evictionCount,evictedBytes:n(this.cacheManager.evictedBytes),redownloads:this.cacheManager.redownloadCount},textureResidency:{identity:"global-page",resident:f,active:p,desired:y,loading:Array.from(this.textureStates.values()).reduce((_,b)=>_+b.loading.size,0),queued:this.textureQueue.length,resultQueue:this.textureResultQueue.length,thresholdsPx:{mediumEnter:Pt.mediumEnterPx,mediumExit:Pt.mediumExitPx,highEnter:this.highTextureEnterPx||Pt.highEnterPx,highExit:(this.highTextureEnterPx||Pt.highEnterPx)*.75},maxTextureSize:this.texStats.maxTextureSize,highSourceSize:this.texStats.highSourceSize,highUploadSize:this.texStats.highUploadSize,highSkippedTopMips:this.texStats.highSkippedTopMips},visibilityPlanner:this.visibilityPlanStats||null,texturePagePlanner:this.texturePagePlanStats||null,geometryFrontier:this.geometryFrontierStats||null,violations:this._perfViolationCount,allocationCount:this.vramLedger.entries.size+this.vramLedger.textureEntries.size,geometryAllocationCount:this.vramLedger.entries.size,texturePageAllocationCount:this.vramLedger.textureEntries.size,movingLod:this.getMovingLodDebugStats()}}getMovingLodDebugStats(){let e=0;for(let s of this.tiles.values()){let r=s.mesh?.children?.find(a=>a.userData.gosperLevel===this.movingLevel);r?.visible&&r.children[0]?.visible&&(e+=r.children[0].count)}let t=this.manifest?.tiles?.length||0,n=Math.max(0,t-this.tiles.size);return{active:this.isMovingView,level:this.movingLevel,flatToFlatMeters:+wn.levelSize(this.movingLevel).toFixed(3),residentCaps:e,fallbackTiles:n,fallbackCaps:this.movingHorizonMesh?.visible?n*(this.movingHorizonChildrenPerTile||0):0,settledHorizonVisible:!!this.horizonMesh?.visible,movingHorizonVisible:!!this.movingHorizonMesh?.visible,visibleLevels:this.isMovingView?[this.movingLevel]:"settled-multi-lod"}}animate(){requestAnimationFrame(()=>this.animate()),this._frameCounter++,xs("processInstantiationQueue",()=>this.processInstantiationQueue()),xs("processTextureResults",()=>this.processTextureResults()),xs("processQueues",()=>this.processQueues());let e=performance.now();this.controls.enableDamping=this.isUserInteracting;let t=this.controls.update();Gr(this.camera,this.controls.target,this.observedCameraPose),fh(this.lastObservedCameraPose,this.observedCameraPose)&&this.notifyCameraMotion(e);let n=this.controls.getPolarAngle()*180/Math.PI,s=n<5.5,r=this.syncHeightFactorFromControls(n),a=this.isMovingView,o=this.wasMovingView;!this.cameraMotion.sample({now:e})&&this.isMovingView&&(this.isMovingView=!1),this.engineState=this.deriveEngineState(s),a&&!this.isMovingView&&(this.needsRender=!0,this.needsLODUpdate=!0,this._beginGeometryMode(!1)),this.isMovingView?this.needsLODUpdate=!0:a&&(this.needsLODUpdate=!0);let c=this.floorState.value,h=this.camera.position.y;this.updateFloorState(r),this.maintainCameraAltitudeDuringAnimation(r),Gr(this.camera,this.controls.target,this.lastObservedCameraPose),(this.floorState.value!==c||this.camera.position.y!==h)&&(this.needsLODUpdate=!0,this.needsRender=!0);let u=this.camera.position.distanceTo(this.lastLODCamPos);if((u>50||this.needsLODUpdate||!this.loaderHidden)&&(xs("updateLOD",()=>this.updateLOD()),u>50&&this.lastLODCamPos.copy(this.camera.position),this.needsLODUpdate=!1),this.loaderHidden||this._updateTexBadge(),this.profiler?.frame(e,this.engineState,t||this.needsRender),!t&&!this.needsRender)return;let d=performance.now();this.updateRenderStats(e),this.updateFps(),this.updateFrametimeGraph(),o!==this.isMovingView&&(this.horizonMesh&&(this.horizonMesh.visible=!this.isMovingView),this.movingHorizonMesh&&(this.movingHorizonMesh.visible=this.isMovingView)),this.wasMovingView=this.isMovingView,this.computeLodRadii(),this.updateLevelVisibility(r),this._updateTexBadge();let m=0;for(let f of this.materialsToUpdate)if(f.needsUpdate&&m++,f.userData.shader){f.userData.shader.uniforms.uHeightFactor.value=r,f.userData.shader.uniforms.uFloorOffset.value=this.floorState.value;let p=f.userData.shader.uniforms.uCameraPos;if(p?.value?.copy&&p.value.copy(this.camera.position),f.userData.isHorizon)continue;if(f.userData.shader.uniforms.uGradientMode.value=this.gradientMode,f.userData.lodIdx!==void 0){let y=f.userData.lodIdx;if(f.userData.forceMovingMode&&y===this.movingLevel)f.userData.shader.uniforms.uLodRadii.value.set(0,1e12),f.userData.shader.uniforms.uFinestBuilt.value=1;else{let _=y<=0?0:this.lodRadii[y-1],b=this.lodRadii[y];f.userData.shader.uniforms.uLodRadii.value.set(_,b),f.userData.shader.uniforms.uFinestBuilt.value=f.userData.isFinest?1:0}}}this.renderer.render(this.scene,this.camera);let g=performance.now()-d,x=ix[this.engineState];if(g>x)if(this._perfViolationCount++,this._perfViolationCount<=sx){let f=[];m>0&&f.push(`mat-recompile:${m}`);let p=this.recentlyUpgradedTextures.filter(y=>e-y.time<50);p.length>0&&f.push(`tex-upgrade:${p.length}`),this.recentlyUpgradedTextures=p.slice(-3),this.geometryRebuildQueue.length>0&&f.push(`geometry-rebuild-queue:${this.geometryRebuildQueue.length}`),f.length===0&&f.push("gpu-render"),console.log("[PERF_VIOLATION] "+JSON.stringify({state:this.engineState,duration:+g.toFixed(1),budget:x,culprits:f,frame:this._frameCounter}))}else{let f=this.engineState;this._perfStats[f]||(this._perfStats[f]={min:1/0,max:-1/0,sum:0,count:0});let p=this._perfStats[f];if(p.min=Math.min(p.min,g),p.max=Math.max(p.max,g),p.sum+=g,p.count++,Object.values(this._perfStats).reduce((_,b)=>_+b.count,0)>=Hh){let _={};for(let[b,S]of Object.entries(this._perfStats))_[b]={count:S.count,avg:+(S.sum/S.count).toFixed(1),min:+S.min.toFixed(1),max:+S.max.toFixed(1)};console.log("[PERF_VIOLATION] "+JSON.stringify({type:"stats",totalViolations:this._perfViolationCount,window:Hh,summary:_,frame:this._frameCounter})),this._perfStats={}}}this.needsRender=!1}};new Ua;qc(window.pistonViewer,Kr)});px();})();
