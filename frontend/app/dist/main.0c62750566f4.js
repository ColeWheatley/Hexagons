(()=>{var lu=Object.create;var qa=Object.defineProperty;var cu=Object.getOwnPropertyDescriptor;var hu=Object.getOwnPropertyNames;var uu=Object.getPrototypeOf,du=Object.prototype.hasOwnProperty;var tt=(s,e,t)=>()=>{if(t)throw t[0];try{return s&&(e=s(s=0)),e}catch(n){throw t=[n],n}};var $a=(s,e)=>()=>{try{return e||s((e={exports:{}}).exports,e),e.exports}catch(t){throw e=0,t}};var fu=(s,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of hu(e))!du.call(s,i)&&i!==t&&qa(s,i,{get:()=>e[i],enumerable:!(n=cu(e,i))||n.enumerable});return s};var oo=(s,e,t)=>(t=s!=null?lu(uu(s)):{},fu(e||!s||!s.__esModule?qa(t,"default",{value:s,enumerable:!0}):t,s));function zi(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(yt[s&255]+yt[s>>8&255]+yt[s>>16&255]+yt[s>>24&255]+"-"+yt[e&255]+yt[e>>8&255]+"-"+yt[e>>16&15|64]+yt[e>>24&255]+"-"+yt[t&63|128]+yt[t>>8&255]+"-"+yt[t>>16&255]+yt[t>>24&255]+yt[n&255]+yt[n>>8&255]+yt[n>>16&255]+yt[n>>24&255]).toLowerCase()}function Mt(s,e,t){return Math.max(e,Math.min(t,s))}function ya(s,e){return(s%e+e)%e}function pd(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function md(s,e,t){return s!==e?(t-s)/(e-s):0}function ts(s,e,t){return(1-t)*s+t*e}function gd(s,e,t,n){return ts(s,e,1-Math.exp(-t*n))}function xd(s,e=1){return e-Math.abs(ya(s,e*2)-e)}function _d(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function yd(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function vd(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Md(s,e){return s+Math.random()*(e-s)}function Sd(s){return s*(.5-Math.random())}function bd(s){s!==void 0&&(Cl=s);let e=Cl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ed(s){return s*es}function wd(s){return s*rs}function Go(s){return(s&s-1)===0&&s!==0}function Td(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function ir(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Ad(s,e,t,n,i){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),p=r((n-e)/2),g=a((n-e)/2);switch(i){case"XYX":s.set(o*h,l*u,l*d,o*c);break;case"YZY":s.set(l*d,o*h,l*u,o*c);break;case"ZXZ":s.set(l*u,l*d,o*h,o*c);break;case"XZX":s.set(o*h,l*g,l*p,o*c);break;case"YXY":s.set(l*p,o*h,l*g,o*c);break;case"ZYZ":s.set(l*g,l*p,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Ei(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function wt(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}function Rc(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function sr(s){return document.createElementNS(("http:"+"//www.w3.org/1999/xhtml"),s)}function Rd(){let s=sr("canvas");return s.style.display="block",s}function ns(s){s in Pl||(Pl[s]=!0,console.warn(s))}function Ci(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function po(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}function mo(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?rr.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}function xo(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Xn.fromArray(s,r);let o=i.x*Math.abs(Xn.x)+i.y*Math.abs(Xn.y)+i.z*Math.abs(Xn.z),l=e.dot(Xn),c=t.dot(Xn),h=n.dot(Xn);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}function To(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}function Gd(s,e,t,n,i,r,a,o){let l;if(e.side===It?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,e.side===On,o),l===null)return null;zs.copy(o),zs.applyMatrix4(s.matrixWorld);let c=t.ray.origin.distanceTo(zs);return c<t.near||c>t.far?null:{distance:c,point:zs.clone(),object:s}}function ks(s,e,t,n,i,r,a,o,l,c){s.getVertexPosition(o,xi),s.getVertexPosition(l,_i),s.getVertexPosition(c,yi);let h=Gd(s,e,t,n,xi,_i,yi,Bs);if(h){i&&(Ns.fromBufferAttribute(i,o),Fs.fromBufferAttribute(i,l),Os.fromBufferAttribute(i,c),h.uv=wi.getInterpolation(Bs,xi,_i,yi,Ns,Fs,Os,new Te)),r&&(Ns.fromBufferAttribute(r,o),Fs.fromBufferAttribute(r,l),Os.fromBufferAttribute(r,c),h.uv1=wi.getInterpolation(Bs,xi,_i,yi,Ns,Fs,Os,new Te),h.uv2=h.uv1),a&&(Vl.fromBufferAttribute(a,o),Wl.fromBufferAttribute(a,l),Xl.fromBufferAttribute(a,c),h.normal=wi.getInterpolation(Bs,xi,_i,yi,Vl,Wl,Xl,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new L,materialIndex:0};wi.getNormal(xi,_i,yi,u.normal),h.face=u}return h}function Fi(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Tt(s){let e={};for(let t=0;t<s.length;t++){let n=Fi(s[t]);for(let i in n)e[i]=n[i]}return e}function Vd(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Pc(s){return s.getRenderTarget()===null?s.outputColorSpace:$e.workingColorSpace}function Ic(){let s=null,e=!1,t=null,n=null;function i(r,a){t(r,a),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Zd(s,e){let t=e.isWebGL2,n=new WeakMap;function i(c,h){let u=c.array,d=c.usage,p=u.byteLength,g=s.createBuffer();s.bindBuffer(h,g),s.bufferData(h,u,d),c.onUploadCallback();let x;if(u instanceof Float32Array)x=s.FLOAT;else if(u instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)x=s.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else x=s.UNSIGNED_SHORT;else if(u instanceof Int16Array)x=s.SHORT;else if(u instanceof Uint32Array)x=s.UNSIGNED_INT;else if(u instanceof Int32Array)x=s.INT;else if(u instanceof Int8Array)x=s.BYTE;else if(u instanceof Uint8Array)x=s.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)x=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:x,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:p}}function r(c,h,u){let d=h.array,p=h._updateRange,g=h.updateRanges;if(s.bindBuffer(u,c),p.count===-1&&g.length===0&&s.bufferSubData(u,0,d),g.length!==0){for(let x=0,m=g.length;x<m;x++){let f=g[x];t?s.bufferSubData(u,f.start*d.BYTES_PER_ELEMENT,d,f.start,f.count):s.bufferSubData(u,f.start*d.BYTES_PER_ELEMENT,d.subarray(f.start,f.start+f.count))}h.clearUpdateRanges()}p.count!==-1&&(t?s.bufferSubData(u,p.offset*d.BYTES_PER_ELEMENT,d,p.offset,p.count):s.bufferSubData(u,p.offset*d.BYTES_PER_ELEMENT,d.subarray(p.offset,p.offset+p.count)),p.count=-1),h.onUploadCallback()}function a(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);let h=n.get(c);h&&(s.deleteBuffer(h.buffer),n.delete(c))}function l(c,h){if(c.isGLBufferAttribute){let d=n.get(c);(!d||d.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);let u=n.get(c);if(u===void 0)n.set(c,i(c,h));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(u.buffer,c,h),u.version=c.version}}return{get:a,remove:o,update:l}}function Pm(s,e,t,n,i,r,a){let o=new Xe(0),l=r===!0?0:1,c,h,u=null,d=0,p=null;function g(m,f){let b=!1,_=f.isScene===!0?f.background:null;_&&_.isTexture&&(_=(f.backgroundBlurriness>0?t:e).get(_)),_===null?x(o,l):_&&_.isColor&&(x(_,1),b=!0);let M=s.xr.getEnvironmentBlendMode();M==="additive"?n.buffers.color.setClear(0,0,0,1,a):M==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||b)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),_&&(_.isCubeTexture||_.mapping===Mr)?(h===void 0&&(h=new Xt(new as(1,1,1),new En({name:"BackgroundCubeMaterial",uniforms:Fi(an.backgroundCube.uniforms),vertexShader:an.backgroundCube.vertexShader,fragmentShader:an.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(S,R,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),h.material.uniforms.envMap.value=_,h.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,h.material.toneMapped=$e.getTransfer(_.colorSpace)!==Je,(u!==_||d!==_.version||p!==s.toneMapping)&&(h.material.needsUpdate=!0,u=_,d=_.version,p=s.toneMapping),h.layers.enableAll(),m.unshift(h,h.geometry,h.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new Xt(new qo(2,2),new En({name:"BackgroundMaterial",uniforms:Fi(an.background.uniforms),vertexShader:an.background.vertexShader,fragmentShader:an.background.fragmentShader,side:On,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=$e.getTransfer(_.colorSpace)!==Je,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||d!==_.version||p!==s.toneMapping)&&(c.material.needsUpdate=!0,u=_,d=_.version,p=s.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null))}function x(m,f){m.getRGB(Gs,Pc(s)),n.buffers.color.setClear(Gs.r,Gs.g,Gs.b,f,a)}return{getClearColor:function(){return o},setClearColor:function(m,f=1){o.set(m),l=f,x(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,x(o,l)},render:g}}function Im(s,e,t,n){let i=s.getParameter(s.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||r!==null,o={},l=m(null),c=l,h=!1;function u(I,U,V,Y,q){let W=!1;if(a){let Q=x(Y,V,U);c!==Q&&(c=Q,p(c.object)),W=f(I,Y,V,q),W&&b(I,Y,V,q)}else{let Q=U.wireframe===!0;(c.geometry!==Y.id||c.program!==V.id||c.wireframe!==Q)&&(c.geometry=Y.id,c.program=V.id,c.wireframe=Q,W=!0)}q!==null&&t.update(q,s.ELEMENT_ARRAY_BUFFER),(W||h)&&(h=!1,N(I,U,V,Y),q!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function d(){return n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()}function p(I){return n.isWebGL2?s.bindVertexArray(I):r.bindVertexArrayOES(I)}function g(I){return n.isWebGL2?s.deleteVertexArray(I):r.deleteVertexArrayOES(I)}function x(I,U,V){let Y=V.wireframe===!0,q=o[I.id];q===void 0&&(q={},o[I.id]=q);let W=q[U.id];W===void 0&&(W={},q[U.id]=W);let Q=W[Y];return Q===void 0&&(Q=m(d()),W[Y]=Q),Q}function m(I){let U=[],V=[],Y=[];for(let q=0;q<i;q++)U[q]=0,V[q]=0,Y[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:V,attributeDivisors:Y,object:I,attributes:{},index:null}}function f(I,U,V,Y){let q=c.attributes,W=U.attributes,Q=0,ne=V.getAttributes();for(let ue in ne)if(ne[ue].location>=0){let Z=q[ue],he=W[ue];if(he===void 0&&(ue==="instanceMatrix"&&I.instanceMatrix&&(he=I.instanceMatrix),ue==="instanceColor"&&I.instanceColor&&(he=I.instanceColor)),Z===void 0||Z.attribute!==he||he&&Z.data!==he.data)return!0;Q++}return c.attributesNum!==Q||c.index!==Y}function b(I,U,V,Y){let q={},W=U.attributes,Q=0,ne=V.getAttributes();for(let ue in ne)if(ne[ue].location>=0){let Z=W[ue];Z===void 0&&(ue==="instanceMatrix"&&I.instanceMatrix&&(Z=I.instanceMatrix),ue==="instanceColor"&&I.instanceColor&&(Z=I.instanceColor));let he={};he.attribute=Z,Z&&Z.data&&(he.data=Z.data),q[ue]=he,Q++}c.attributes=q,c.attributesNum=Q,c.index=Y}function _(){let I=c.newAttributes;for(let U=0,V=I.length;U<V;U++)I[U]=0}function M(I){S(I,0)}function S(I,U){let V=c.newAttributes,Y=c.enabledAttributes,q=c.attributeDivisors;V[I]=1,Y[I]===0&&(s.enableVertexAttribArray(I),Y[I]=1),q[I]!==U&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](I,U),q[I]=U)}function R(){let I=c.newAttributes,U=c.enabledAttributes;for(let V=0,Y=U.length;V<Y;V++)U[V]!==I[V]&&(s.disableVertexAttribArray(V),U[V]=0)}function E(I,U,V,Y,q,W,Q){Q===!0?s.vertexAttribIPointer(I,U,V,q,W):s.vertexAttribPointer(I,U,V,Y,q,W)}function N(I,U,V,Y){if(n.isWebGL2===!1&&(I.isInstancedMesh||Y.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;_();let q=Y.attributes,W=V.getAttributes(),Q=U.defaultAttributeValues;for(let ne in W){let ue=W[ne];if(ue.location>=0){let G=q[ne];if(G===void 0&&(ne==="instanceMatrix"&&I.instanceMatrix&&(G=I.instanceMatrix),ne==="instanceColor"&&I.instanceColor&&(G=I.instanceColor)),G!==void 0){let Z=G.normalized,he=G.itemSize,_e=t.get(G);if(_e===void 0)continue;let ge=_e.buffer,Ce=_e.type,Pe=_e.bytesPerElement,be=n.isWebGL2===!0&&(Ce===s.INT||Ce===s.UNSIGNED_INT||G.gpuType===yc);if(G.isInterleavedBufferAttribute){let Ge=G.data,O=Ge.stride,ut=G.offset;if(Ge.isInstancedInterleavedBuffer){for(let Me=0;Me<ue.locationSize;Me++)S(ue.location+Me,Ge.meshPerAttribute);I.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=Ge.meshPerAttribute*Ge.count)}else for(let Me=0;Me<ue.locationSize;Me++)M(ue.location+Me);s.bindBuffer(s.ARRAY_BUFFER,ge);for(let Me=0;Me<ue.locationSize;Me++)E(ue.location+Me,he/ue.locationSize,Ce,Z,O*Pe,(ut+he/ue.locationSize*Me)*Pe,be)}else{if(G.isInstancedBufferAttribute){for(let Ge=0;Ge<ue.locationSize;Ge++)S(ue.location+Ge,G.meshPerAttribute);I.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=G.meshPerAttribute*G.count)}else for(let Ge=0;Ge<ue.locationSize;Ge++)M(ue.location+Ge);s.bindBuffer(s.ARRAY_BUFFER,ge);for(let Ge=0;Ge<ue.locationSize;Ge++)E(ue.location+Ge,he/ue.locationSize,Ce,Z,he*Pe,he/ue.locationSize*Ge*Pe,be)}}else if(Q!==void 0){let Z=Q[ne];if(Z!==void 0)switch(Z.length){case 2:s.vertexAttrib2fv(ue.location,Z);break;case 3:s.vertexAttrib3fv(ue.location,Z);break;case 4:s.vertexAttrib4fv(ue.location,Z);break;default:s.vertexAttrib1fv(ue.location,Z)}}}}R()}function v(){X();for(let I in o){let U=o[I];for(let V in U){let Y=U[V];for(let q in Y)g(Y[q].object),delete Y[q];delete U[V]}delete o[I]}}function T(I){if(o[I.id]===void 0)return;let U=o[I.id];for(let V in U){let Y=U[V];for(let q in Y)g(Y[q].object),delete Y[q];delete U[V]}delete o[I.id]}function F(I){for(let U in o){let V=o[U];if(V[I.id]===void 0)continue;let Y=V[I.id];for(let q in Y)g(Y[q].object),delete Y[q];delete V[I.id]}}function X(){j(),h=!0,c!==l&&(c=l,p(c.object))}function j(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:u,reset:X,resetDefaultState:j,dispose:v,releaseStatesOfGeometry:T,releaseStatesOfProgram:F,initAttributes:_,enableAttribute:M,disableUnusedAttributes:R}}function Lm(s,e,t,n){let i=n.isWebGL2,r;function a(h){r=h}function o(h,u){s.drawArrays(r,h,u),t.update(u,r,1)}function l(h,u,d){if(d===0)return;let p,g;if(i)p=s,g="drawArraysInstanced";else if(p=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](r,h,u,d),t.update(u,r,d)}function c(h,u,d){if(d===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d;g++)this.render(h[g],u[g]);else{p.multiDrawArraysWEBGL(r,h,0,u,0,d);let g=0;for(let x=0;x<d;x++)g+=u[x];t.update(g,r,1)}}this.setMode=a,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function Dm(s,e,t){let n;function i(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){let E=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(E){if(E==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let a=typeof WebGL2RenderingContext<"u"&&s.constructor.name==="WebGL2RenderingContext",o=t.precision!==void 0?t.precision:"highp",l=r(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);let c=a||e.has("WEBGL_draw_buffers"),h=t.logarithmicDepthBuffer===!0,u=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),d=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=s.getParameter(s.MAX_TEXTURE_SIZE),g=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),x=s.getParameter(s.MAX_VERTEX_ATTRIBS),m=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),f=s.getParameter(s.MAX_VARYING_VECTORS),b=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),_=d>0,M=a||e.has("OES_texture_float"),S=_&&M,R=a?s.getParameter(s.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:c,getMaxAnisotropy:i,getMaxPrecision:r,precision:o,logarithmicDepthBuffer:h,maxTextures:u,maxVertexTextures:d,maxTextureSize:p,maxCubemapSize:g,maxAttributes:x,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:b,vertexTextures:_,floatFragmentTextures:M,floatVertexTextures:S,maxSamples:R}}function Um(s){let e=this,t=null,n=0,i=!1,r=!1,a=new Ft,o=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let p=u.length!==0||d||n!==0||i;return i=d,n=u.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,p){let g=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,f=s.get(u);if(!i||g===null||g.length===0||r&&!m)r?h(null):c();else{let b=r?0:n,_=b*4,M=f.clippingState||null;l.value=M,M=h(g,d,_,p);for(let S=0;S!==_;++S)M[S]=t[S];f.clippingState=M,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,p,g){let x=u!==null?u.length:0,m=null;if(x!==0){if(m=l.value,g!==!0||m===null){let f=p+x*4,b=d.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<f)&&(m=new Float32Array(f));for(let _=0,M=p;_!==x;++_,M+=4)a.copy(u[_]).applyMatrix4(b,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}function Nm(s){let e=new WeakMap;function t(a,o){return o===Oo?a.mapping=Ii:o===Bo&&(a.mapping=Li),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Oo||o===Bo)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Yo(l.height/2);return c.fromEquirectangularTexture(s,a),e.set(a,c),a.addEventListener("dispose",i),t(c.texture,a.mapping)}else return null}}return a}function i(a){let o=a.target;o.removeEventListener("dispose",i);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}function Fm(s){let e=[],t=[],n=[],i=s,r=s-Ti+1+Yl.length;for(let a=0;a<r;a++){let o=Math.pow(2,i);t.push(o);let l=1/o;a>s-Ti?l=Yl[a-s+Ti-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],p=6,g=6,x=3,m=2,f=1,b=new Float32Array(x*g*p),_=new Float32Array(m*g*p),M=new Float32Array(f*g*p);for(let R=0;R<p;R++){let E=R%3*2/3-1,N=R>2?0:-1,v=[E,N,0,E+2/3,N,0,E+2/3,N+1,0,E,N,0,E+2/3,N+1,0,E,N+1,0];b.set(v,x*g*R),_.set(d,m*g*R);let T=[R,R,R,R,R,R];M.set(T,f*g*R)}let S=new cn;S.setAttribute("position",new Bt(b,x)),S.setAttribute("uv",new Bt(_,m)),S.setAttribute("faceIndex",new Bt(M,f)),e.push(S),i>Ti&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Zl(s,e,t){let n=new bn(s,e,t);return n.texture.mapping=Mr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Vs(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function Om(s,e,t){let n=new Float32Array(Kn),i=new L(0,1,0);return new En({name:"SphericalGaussianBlur",defines:{n:Kn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:va(),fragmentShader:`

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
		`,blending:Un,depthTest:!1,depthWrite:!1})}function Kl(){return new En({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:va(),fragmentShader:`

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
		`,blending:Un,depthTest:!1,depthWrite:!1})}function Jl(){return new En({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Un,depthTest:!1,depthWrite:!1})}function va(){return`

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
	`}function Bm(s){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===Oo||l===Bo,h=l===Ii||l===Li;if(c||h)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let u=e.get(o);return t===null&&(t=new fr(s)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),e.set(o,u),u.texture}else{if(e.has(o))return e.get(o).texture;{let u=o.image;if(c&&u&&u.height>0||h&&u&&i(u)){t===null&&(t=new fr(s));let d=c?t.fromEquirectangular(o):t.fromCubemap(o);return e.set(o,d),o.addEventListener("dispose",r),d.texture}else return null}}}return o}function i(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function zm(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){let i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function km(s,e,t,n){let i={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let x=d.morphAttributes[g];for(let m=0,f=x.length;m<f;m++)e.remove(x[m])}d.removeEventListener("dispose",a),delete i[d.id];let p=r.get(d);p&&(e.remove(p),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return i[d.id]===!0||(d.addEventListener("dispose",a),i[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],s.ARRAY_BUFFER);let p=u.morphAttributes;for(let g in p){let x=p[g];for(let m=0,f=x.length;m<f;m++)e.update(x[m],s.ARRAY_BUFFER)}}function c(u){let d=[],p=u.index,g=u.attributes.position,x=0;if(p!==null){let b=p.array;x=p.version;for(let _=0,M=b.length;_<M;_+=3){let S=b[_+0],R=b[_+1],E=b[_+2];d.push(S,R,R,E,E,S)}}else if(g!==void 0){let b=g.array;x=g.version;for(let _=0,M=b.length/3-1;_<M;_+=3){let S=_+0,R=_+1,E=_+2;d.push(S,R,R,E,E,S)}}else return;let m=new(Rc(d)?hr:cr)(d,1);m.version=x;let f=r.get(u);f&&e.remove(f),r.set(u,m)}function h(u){let d=r.get(u);if(d){let p=u.index;p!==null&&d.version<p.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Hm(s,e,t,n){let i=n.isWebGL2,r;function a(p){r=p}let o,l;function c(p){o=p.type,l=p.bytesPerElement}function h(p,g){s.drawElements(r,g,o,p*l),t.update(g,r,1)}function u(p,g,x){if(x===0)return;let m,f;if(i)m=s,f="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](r,g,o,p*l,x),t.update(g,r,x)}function d(p,g,x){if(x===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<x;f++)this.render(p[f]/l,g[f]);else{m.multiDrawElementsWEBGL(r,g,0,o,p,0,x);let f=0;for(let b=0;b<x;b++)f+=g[b];t.update(f,r,1)}}this.setMode=a,this.setIndex=c,this.render=h,this.renderInstances=u,this.renderMultiDraw=d}function Gm(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case s.TRIANGLES:t.triangles+=o*(r/3);break;case s.LINES:t.lines+=o*(r/2);break;case s.LINE_STRIP:t.lines+=o*(r-1);break;case s.LINE_LOOP:t.lines+=o*r;break;case s.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Vm(s,e){return s[0]-e[0]}function Wm(s,e){return Math.abs(e[1])-Math.abs(s[1])}function Xm(s,e,t){let n={},i=new Float32Array(8),r=new WeakMap,a=new gt,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,h,u){let d=c.morphTargetInfluences;if(e.isWebGL2===!0){let p=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,g=p!==void 0?p.length:0,x=r.get(h);if(x===void 0||x.count!==g){let I=function(){X.dispose(),r.delete(h),h.removeEventListener("dispose",I)};x!==void 0&&x.texture.dispose();let b=h.morphAttributes.position!==void 0,_=h.morphAttributes.normal!==void 0,M=h.morphAttributes.color!==void 0,S=h.morphAttributes.position||[],R=h.morphAttributes.normal||[],E=h.morphAttributes.color||[],N=0;b===!0&&(N=1),_===!0&&(N=2),M===!0&&(N=3);let v=h.attributes.position.count*N,T=1;v>e.maxTextureSize&&(T=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let F=new Float32Array(v*T*4*g),X=new ar(F,v,T,g);X.type=Dn,X.needsUpdate=!0;let j=N*4;for(let U=0;U<g;U++){let V=S[U],Y=R[U],q=E[U],W=v*T*4*U;for(let Q=0;Q<V.count;Q++){let ne=Q*j;b===!0&&(a.fromBufferAttribute(V,Q),F[W+ne+0]=a.x,F[W+ne+1]=a.y,F[W+ne+2]=a.z,F[W+ne+3]=0),_===!0&&(a.fromBufferAttribute(Y,Q),F[W+ne+4]=a.x,F[W+ne+5]=a.y,F[W+ne+6]=a.z,F[W+ne+7]=0),M===!0&&(a.fromBufferAttribute(q,Q),F[W+ne+8]=a.x,F[W+ne+9]=a.y,F[W+ne+10]=a.z,F[W+ne+11]=q.itemSize===4?a.w:1)}}x={count:g,texture:X,size:new Te(v,T)},r.set(h,x),h.addEventListener("dispose",I)}let m=0;for(let b=0;b<d.length;b++)m+=d[b];let f=h.morphTargetsRelative?1:1-m;u.getUniforms().setValue(s,"morphTargetBaseInfluence",f),u.getUniforms().setValue(s,"morphTargetInfluences",d),u.getUniforms().setValue(s,"morphTargetsTexture",x.texture,t),u.getUniforms().setValue(s,"morphTargetsTextureSize",x.size)}else{let p=d===void 0?0:d.length,g=n[h.id];if(g===void 0||g.length!==p){g=[];for(let _=0;_<p;_++)g[_]=[_,0];n[h.id]=g}for(let _=0;_<p;_++){let M=g[_];M[0]=_,M[1]=d[_]}g.sort(Wm);for(let _=0;_<8;_++)_<p&&g[_][1]?(o[_][0]=g[_][0],o[_][1]=g[_][1]):(o[_][0]=Number.MAX_SAFE_INTEGER,o[_][1]=0);o.sort(Vm);let x=h.morphAttributes.position,m=h.morphAttributes.normal,f=0;for(let _=0;_<8;_++){let M=o[_],S=M[0],R=M[1];S!==Number.MAX_SAFE_INTEGER&&R?(x&&h.getAttribute("morphTarget"+_)!==x[S]&&h.setAttribute("morphTarget"+_,x[S]),m&&h.getAttribute("morphNormal"+_)!==m[S]&&h.setAttribute("morphNormal"+_,m[S]),i[_]=R,f+=R):(x&&h.hasAttribute("morphTarget"+_)===!0&&h.deleteAttribute("morphTarget"+_),m&&h.hasAttribute("morphNormal"+_)===!0&&h.deleteAttribute("morphNormal"+_),i[_]=0)}let b=h.morphTargetsRelative?1:1-f;u.getUniforms().setValue(s,"morphTargetBaseInfluence",b),u.getUniforms().setValue(s,"morphTargetInfluences",i)}}return{update:l}}function Ym(s,e,t,n){let i=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=e.get(l,h);if(i.get(u)!==c&&(e.update(u),i.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),i.get(l)!==c&&(t.update(l.instanceMatrix,s.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,s.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;i.get(d)!==c&&(d.update(),i.set(d,c))}return u}function a(){i=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:a}}function ki(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=jl[i];if(r===void 0&&(r=new Float32Array(i),jl[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function lt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function ct(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function wr(s,e){let t=Ql[e];t===void 0&&(t=new Int32Array(e),Ql[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function qm(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function $m(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(lt(t,e))return;s.uniform2fv(this.addr,e),ct(t,e)}}function Zm(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(lt(t,e))return;s.uniform3fv(this.addr,e),ct(t,e)}}function Km(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(lt(t,e))return;s.uniform4fv(this.addr,e),ct(t,e)}}function Jm(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(lt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),ct(t,e)}else{if(lt(t,n))return;nc.set(n),s.uniformMatrix2fv(this.addr,!1,nc),ct(t,n)}}function jm(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(lt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),ct(t,e)}else{if(lt(t,n))return;tc.set(n),s.uniformMatrix3fv(this.addr,!1,tc),ct(t,n)}}function Qm(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(lt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),ct(t,e)}else{if(lt(t,n))return;ec.set(n),s.uniformMatrix4fv(this.addr,!1,ec),ct(t,n)}}function eg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function tg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(lt(t,e))return;s.uniform2iv(this.addr,e),ct(t,e)}}function ng(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(lt(t,e))return;s.uniform3iv(this.addr,e),ct(t,e)}}function ig(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(lt(t,e))return;s.uniform4iv(this.addr,e),ct(t,e)}}function sg(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function rg(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(lt(t,e))return;s.uniform2uiv(this.addr,e),ct(t,e)}}function og(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(lt(t,e))return;s.uniform3uiv(this.addr,e),ct(t,e)}}function ag(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(lt(t,e))return;s.uniform4uiv(this.addr,e),ct(t,e)}}function lg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r=this.type===s.SAMPLER_2D_SHADOW?Dc:Lc;t.setTexture2D(e||r,i)}function cg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Nc,i)}function hg(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Fc,i)}function ug(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Uc,i)}function dg(s){switch(s){case 5126:return qm;case 35664:return $m;case 35665:return Zm;case 35666:return Km;case 35674:return Jm;case 35675:return jm;case 35676:return Qm;case 5124:case 35670:return eg;case 35667:case 35671:return tg;case 35668:case 35672:return ng;case 35669:case 35673:return ig;case 5125:return sg;case 36294:return rg;case 36295:return og;case 36296:return ag;case 35678:case 36198:case 36298:case 36306:case 35682:return lg;case 35679:case 36299:case 36307:return cg;case 35680:case 36300:case 36308:case 36293:return hg;case 36289:case 36303:case 36311:case 36292:return ug}}function fg(s,e){s.uniform1fv(this.addr,e)}function pg(s,e){let t=ki(e,this.size,2);s.uniform2fv(this.addr,t)}function mg(s,e){let t=ki(e,this.size,3);s.uniform3fv(this.addr,t)}function gg(s,e){let t=ki(e,this.size,4);s.uniform4fv(this.addr,t)}function xg(s,e){let t=ki(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function _g(s,e){let t=ki(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function yg(s,e){let t=ki(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function vg(s,e){s.uniform1iv(this.addr,e)}function Mg(s,e){s.uniform2iv(this.addr,e)}function Sg(s,e){s.uniform3iv(this.addr,e)}function bg(s,e){s.uniform4iv(this.addr,e)}function Eg(s,e){s.uniform1uiv(this.addr,e)}function wg(s,e){s.uniform2uiv(this.addr,e)}function Tg(s,e){s.uniform3uiv(this.addr,e)}function Ag(s,e){s.uniform4uiv(this.addr,e)}function Rg(s,e,t){let n=this.cache,i=e.length,r=wr(t,i);lt(n,r)||(s.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==i;++a)t.setTexture2D(e[a]||Lc,r[a])}function Cg(s,e,t){let n=this.cache,i=e.length,r=wr(t,i);lt(n,r)||(s.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||Nc,r[a])}function Pg(s,e,t){let n=this.cache,i=e.length,r=wr(t,i);lt(n,r)||(s.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||Fc,r[a])}function Ig(s,e,t){let n=this.cache,i=e.length,r=wr(t,i);lt(n,r)||(s.uniform1iv(this.addr,r),ct(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||Uc,r[a])}function Lg(s){switch(s){case 5126:return fg;case 35664:return pg;case 35665:return mg;case 35666:return gg;case 35674:return xg;case 35675:return _g;case 35676:return yg;case 5124:case 35670:return vg;case 35667:case 35671:return Mg;case 35668:case 35672:return Sg;case 35669:case 35673:return bg;case 5125:return Eg;case 36294:return wg;case 36295:return Tg;case 36296:return Ag;case 35678:case 36198:case 36298:case 36306:case 35682:return Rg;case 35679:case 36299:case 36307:return Cg;case 35680:case 36300:case 36308:case 36293:return Pg;case 36289:case 36303:case 36311:case 36292:return Ig}}function ic(s,e){s.seq.push(e),s.map[e.id]=e}function Dg(s,e,t){let n=s.name,i=n.length;for(Uo.lastIndex=0;;){let r=Uo.exec(n),a=Uo.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){ic(t,c===void 0?new Zo(o,s,e):new Ko(o,s,e));break}else{let u=t.map[o];u===void 0&&(u=new Jo(o),ic(t,u)),t=u}}}function sc(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}function Fg(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=i;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}function Og(s){let e=$e.getPrimaries($e.workingColorSpace),t=$e.getPrimaries(s),n;switch(e===t?n="":e===tr&&t===er?n="LinearDisplayP3ToLinearSRGB":e===er&&t===tr&&(n="LinearSRGBToLinearDisplayP3"),s){case tn:case br:return[n,"LinearTransferOETF"];case at:case _a:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",s),[n,"LinearTransferOETF"]}}function rc(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";let r=/ERROR: 0:(\d+)/.exec(i);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+Fg(s.getShaderSource(e),a)}else return i}function Bg(s,e){let t=Og(e);return`vec4 ${s}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function zg(s,e){let t;switch(e){case Gu:t="Linear";break;case Vu:t="Reinhard";break;case Wu:t="OptimizedCineon";break;case Xu:t="ACESFilmic";break;case qu:t="AgX";break;case Yu:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function kg(s){return[s.extensionDerivatives||s.envMapCubeUVHeight||s.bumpMap||s.normalMapTangentSpace||s.clearcoatNormalMap||s.flatShading||s.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(s.extensionFragDepth||s.logarithmicDepthBuffer)&&s.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",s.extensionDrawBuffers&&s.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(s.extensionShaderTextureLOD||s.envMap||s.transmission)&&s.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Ai).join(`
`)}function Hg(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Ai).join(`
`)}function Gg(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Vg(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),a=r.name,o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:s.getAttribLocation(e,a),locationSize:o}}return t}function Ai(s){return s!==""}function oc(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ac(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}function jo(s){return s.replace(Wg,Yg)}function Yg(s,e){let t=Fe[e];if(t===void 0){let n=Xg.get(e);if(n!==void 0)t=Fe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return jo(t)}function lc(s){return s.replace(qg,$g)}function $g(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function cc(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Zg(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===gc?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===gu?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===Mn&&(e="SHADOWMAP_TYPE_VSM"),e}function Kg(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Ii:case Li:e="ENVMAP_TYPE_CUBE";break;case Mr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Jg(s){let e="ENVMAP_MODE_REFLECTION";return s.envMap&&s.envMapMode===Li&&(e="ENVMAP_MODE_REFRACTION"),e}function jg(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case xc:e="ENVMAP_BLENDING_MULTIPLY";break;case ku:e="ENVMAP_BLENDING_MIX";break;case Hu:e="ENVMAP_BLENDING_ADD";break}return e}function Qg(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function e0(s,e,t,n){let i=s.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Zg(t),c=Kg(t),h=Jg(t),u=jg(t),d=Qg(t),p=t.isWebGL2?"":kg(t),g=Hg(t),x=Gg(r),m=i.createProgram(),f,b,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Ai).join(`
`),f.length>0&&(f+=`
`),b=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Ai).join(`
`),b.length>0&&(b+=`
`)):(f=[cc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ai).join(`
`),b=[p,cc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Nn?"#define TONE_MAPPING":"",t.toneMapping!==Nn?Fe.tonemapping_pars_fragment:"",t.toneMapping!==Nn?zg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Fe.colorspace_pars_fragment,Bg("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ai).join(`
`)),a=jo(a),a=oc(a,t),a=ac(a,t),o=jo(o),o=oc(o,t),o=ac(o,t),a=lc(a),o=lc(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,b=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Rl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Rl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+b);let M=_+f+a,S=_+b+o,R=sc(i,i.VERTEX_SHADER,M),E=sc(i,i.FRAGMENT_SHADER,S);i.attachShader(m,R),i.attachShader(m,E),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m);function N(X){if(s.debug.checkShaderErrors){let j=i.getProgramInfoLog(m).trim(),I=i.getShaderInfoLog(R).trim(),U=i.getShaderInfoLog(E).trim(),V=!0,Y=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1)if(V=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,m,R,E);else{let q=rc(i,R,"vertex"),W=rc(i,E,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Program Info Log: `+j+`
`+q+`
`+W)}else j!==""?console.warn("THREE.WebGLProgram: Program Info Log:",j):(I===""||U==="")&&(Y=!1);Y&&(X.diagnostics={runnable:V,programLog:j,vertexShader:{log:I,prefix:f},fragmentShader:{log:U,prefix:b}})}i.deleteShader(R),i.deleteShader(E),v=new Pi(i,m),T=Vg(i,m)}let v;this.getUniforms=function(){return v===void 0&&N(this),v};let T;this.getAttributes=function(){return T===void 0&&N(this),T};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=i.getProgramParameter(m,Ug)),F},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Ng++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=R,this.fragmentShader=E,this}function n0(s,e,t,n,i,r,a){let o=new os,l=new Qo,c=[],h=i.isWebGL2,u=i.logarithmicDepthBuffer,d=i.vertexTextures,p=i.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(v){return v===0?"uv":`uv${v}`}function m(v,T,F,X,j){let I=X.fog,U=j.geometry,V=v.isMeshStandardMaterial?X.environment:null,Y=(v.isMeshStandardMaterial?t:e).get(v.envMap||V),q=Y&&Y.mapping===Mr?Y.image.height:null,W=g[v.type];v.precision!==null&&(p=i.getMaxPrecision(v.precision),p!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",p,"instead."));let Q=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,ne=Q!==void 0?Q.length:0,ue=0;U.morphAttributes.position!==void 0&&(ue=1),U.morphAttributes.normal!==void 0&&(ue=2),U.morphAttributes.color!==void 0&&(ue=3);let G,Z,he,_e;if(W){let bt=an[W];G=bt.vertexShader,Z=bt.fragmentShader}else G=v.vertexShader,Z=v.fragmentShader,l.update(v),he=l.getVertexShaderID(v),_e=l.getFragmentShaderID(v);let ge=s.getRenderTarget(),Ce=j.isInstancedMesh===!0,Pe=j.isBatchedMesh===!0,be=!!v.map,Ge=!!v.matcap,O=!!Y,ut=!!v.aoMap,Me=!!v.lightMap,Ae=!!v.bumpMap,pe=!!v.normalMap,Ke=!!v.displacementMap,Ie=!!v.emissiveMap,A=!!v.metalnessMap,y=!!v.roughnessMap,B=v.anisotropy>0,te=v.clearcoat>0,J=v.iridescence>0,ee=v.sheen>0,me=v.transmission>0,ce=B&&!!v.anisotropyMap,fe=te&&!!v.clearcoatMap,Ee=te&&!!v.clearcoatNormalMap,De=te&&!!v.clearcoatRoughnessMap,K=J&&!!v.iridescenceMap,Ve=J&&!!v.iridescenceThicknessMap,C=ee&&!!v.sheenColorMap,$=ee&&!!v.sheenRoughnessMap,ae=!!v.specularMap,ie=!!v.specularColorMap,xe=!!v.specularIntensityMap,ze=me&&!!v.transmissionMap,We=me&&!!v.thicknessMap,Oe=!!v.gradientMap,oe=!!v.alphaMap,P=v.alphaTest>0,se=!!v.alphaHash,re=!!v.extensions,Se=!!U.attributes.uv1,ye=!!U.attributes.uv2,Ye=!!U.attributes.uv3,qe=Nn;return v.toneMapped&&(ge===null||ge.isXRRenderTarget===!0)&&(qe=s.toneMapping),{isWebGL2:h,shaderID:W,shaderType:v.type,shaderName:v.name,vertexShader:G,fragmentShader:Z,defines:v.defines,customVertexShaderID:he,customFragmentShaderID:_e,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:p,batching:Pe,instancing:Ce,instancingColor:Ce&&j.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:ge===null?s.outputColorSpace:ge.isXRRenderTarget===!0?ge.texture.colorSpace:tn,map:be,matcap:Ge,envMap:O,envMapMode:O&&Y.mapping,envMapCubeUVHeight:q,aoMap:ut,lightMap:Me,bumpMap:Ae,normalMap:pe,displacementMap:d&&Ke,emissiveMap:Ie,normalMapObjectSpace:pe&&v.normalMapType===od,normalMapTangentSpace:pe&&v.normalMapType===rd,metalnessMap:A,roughnessMap:y,anisotropy:B,anisotropyMap:ce,clearcoat:te,clearcoatMap:fe,clearcoatNormalMap:Ee,clearcoatRoughnessMap:De,iridescence:J,iridescenceMap:K,iridescenceThicknessMap:Ve,sheen:ee,sheenColorMap:C,sheenRoughnessMap:$,specularMap:ae,specularColorMap:ie,specularIntensityMap:xe,transmission:me,transmissionMap:ze,thicknessMap:We,gradientMap:Oe,opaque:v.transparent===!1&&v.blending===Ri,alphaMap:oe,alphaTest:P,alphaHash:se,combine:v.combine,mapUv:be&&x(v.map.channel),aoMapUv:ut&&x(v.aoMap.channel),lightMapUv:Me&&x(v.lightMap.channel),bumpMapUv:Ae&&x(v.bumpMap.channel),normalMapUv:pe&&x(v.normalMap.channel),displacementMapUv:Ke&&x(v.displacementMap.channel),emissiveMapUv:Ie&&x(v.emissiveMap.channel),metalnessMapUv:A&&x(v.metalnessMap.channel),roughnessMapUv:y&&x(v.roughnessMap.channel),anisotropyMapUv:ce&&x(v.anisotropyMap.channel),clearcoatMapUv:fe&&x(v.clearcoatMap.channel),clearcoatNormalMapUv:Ee&&x(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:De&&x(v.clearcoatRoughnessMap.channel),iridescenceMapUv:K&&x(v.iridescenceMap.channel),iridescenceThicknessMapUv:Ve&&x(v.iridescenceThicknessMap.channel),sheenColorMapUv:C&&x(v.sheenColorMap.channel),sheenRoughnessMapUv:$&&x(v.sheenRoughnessMap.channel),specularMapUv:ae&&x(v.specularMap.channel),specularColorMapUv:ie&&x(v.specularColorMap.channel),specularIntensityMapUv:xe&&x(v.specularIntensityMap.channel),transmissionMapUv:ze&&x(v.transmissionMap.channel),thicknessMapUv:We&&x(v.thicknessMap.channel),alphaMapUv:oe&&x(v.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(pe||B),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,vertexUv1s:Se,vertexUv2s:ye,vertexUv3s:Ye,pointsUvs:j.isPoints===!0&&!!U.attributes.uv&&(be||oe),fog:!!I,useFog:v.fog===!0,fogExp2:I&&I.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:j.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:ne,morphTextureStride:ue,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:v.dithering,shadowMapEnabled:s.shadowMap.enabled&&F.length>0,shadowMapType:s.shadowMap.type,toneMapping:qe,useLegacyLights:s._useLegacyLights,decodeVideoTexture:be&&v.map.isVideoTexture===!0&&$e.getTransfer(v.map.colorSpace)===Je,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===jt,flipSided:v.side===It,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionDerivatives:re&&v.extensions.derivatives===!0,extensionFragDepth:re&&v.extensions.fragDepth===!0,extensionDrawBuffers:re&&v.extensions.drawBuffers===!0,extensionShaderTextureLOD:re&&v.extensions.shaderTextureLOD===!0,extensionClipCullDistance:re&&v.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()}}function f(v){let T=[];if(v.shaderID?T.push(v.shaderID):(T.push(v.customVertexShaderID),T.push(v.customFragmentShaderID)),v.defines!==void 0)for(let F in v.defines)T.push(F),T.push(v.defines[F]);return v.isRawShaderMaterial===!1&&(b(T,v),_(T,v),T.push(s.outputColorSpace)),T.push(v.customProgramCacheKey),T.join()}function b(v,T){v.push(T.precision),v.push(T.outputColorSpace),v.push(T.envMapMode),v.push(T.envMapCubeUVHeight),v.push(T.mapUv),v.push(T.alphaMapUv),v.push(T.lightMapUv),v.push(T.aoMapUv),v.push(T.bumpMapUv),v.push(T.normalMapUv),v.push(T.displacementMapUv),v.push(T.emissiveMapUv),v.push(T.metalnessMapUv),v.push(T.roughnessMapUv),v.push(T.anisotropyMapUv),v.push(T.clearcoatMapUv),v.push(T.clearcoatNormalMapUv),v.push(T.clearcoatRoughnessMapUv),v.push(T.iridescenceMapUv),v.push(T.iridescenceThicknessMapUv),v.push(T.sheenColorMapUv),v.push(T.sheenRoughnessMapUv),v.push(T.specularMapUv),v.push(T.specularColorMapUv),v.push(T.specularIntensityMapUv),v.push(T.transmissionMapUv),v.push(T.thicknessMapUv),v.push(T.combine),v.push(T.fogExp2),v.push(T.sizeAttenuation),v.push(T.morphTargetsCount),v.push(T.morphAttributeCount),v.push(T.numDirLights),v.push(T.numPointLights),v.push(T.numSpotLights),v.push(T.numSpotLightMaps),v.push(T.numHemiLights),v.push(T.numRectAreaLights),v.push(T.numDirLightShadows),v.push(T.numPointLightShadows),v.push(T.numSpotLightShadows),v.push(T.numSpotLightShadowsWithMaps),v.push(T.numLightProbes),v.push(T.shadowMapType),v.push(T.toneMapping),v.push(T.numClippingPlanes),v.push(T.numClipIntersection),v.push(T.depthPacking)}function _(v,T){o.disableAll(),T.isWebGL2&&o.enable(0),T.supportsVertexTextures&&o.enable(1),T.instancing&&o.enable(2),T.instancingColor&&o.enable(3),T.matcap&&o.enable(4),T.envMap&&o.enable(5),T.normalMapObjectSpace&&o.enable(6),T.normalMapTangentSpace&&o.enable(7),T.clearcoat&&o.enable(8),T.iridescence&&o.enable(9),T.alphaTest&&o.enable(10),T.vertexColors&&o.enable(11),T.vertexAlphas&&o.enable(12),T.vertexUv1s&&o.enable(13),T.vertexUv2s&&o.enable(14),T.vertexUv3s&&o.enable(15),T.vertexTangents&&o.enable(16),T.anisotropy&&o.enable(17),T.alphaHash&&o.enable(18),T.batching&&o.enable(19),v.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.skinning&&o.enable(4),T.morphTargets&&o.enable(5),T.morphNormals&&o.enable(6),T.morphColors&&o.enable(7),T.premultipliedAlpha&&o.enable(8),T.shadowMapEnabled&&o.enable(9),T.useLegacyLights&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),v.push(o.mask)}function M(v){let T=g[v.type],F;if(T){let X=an[T];F=Wd.clone(X.uniforms)}else F=v.uniforms;return F}function S(v,T){let F;for(let X=0,j=c.length;X<j;X++){let I=c[X];if(I.cacheKey===T){F=I,++F.usedTimes;break}}return F===void 0&&(F=new e0(s,T,v,r),c.push(F)),F}function R(v){if(--v.usedTimes===0){let T=c.indexOf(v);c[T]=c[c.length-1],c.pop(),v.destroy()}}function E(v){l.remove(v)}function N(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:M,acquireProgram:S,releaseProgram:R,releaseShaderCache:E,programs:c,dispose:N}}function i0(){let s=new WeakMap;function e(r){let a=s.get(r);return a===void 0&&(a={},s.set(r,a)),a}function t(r){s.delete(r)}function n(r,a,o){s.get(r)[a]=o}function i(){s=new WeakMap}return{get:e,remove:t,update:n,dispose:i}}function s0(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function hc(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function uc(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function a(u,d,p,g,x,m){let f=s[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:p,groupOrder:g,renderOrder:u.renderOrder,z:x,group:m},s[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=x,f.group=m),e++,f}function o(u,d,p,g,x,m){let f=a(u,d,p,g,x,m);p.transmission>0?n.push(f):p.transparent===!0?i.push(f):t.push(f)}function l(u,d,p,g,x,m){let f=a(u,d,p,g,x,m);p.transmission>0?n.unshift(f):p.transparent===!0?i.unshift(f):t.unshift(f)}function c(u,d){t.length>1&&t.sort(u||s0),n.length>1&&n.sort(d||hc),i.length>1&&i.sort(d||hc)}function h(){for(let u=e,d=s.length;u<d;u++){let p=s[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:o,unshift:l,finish:h,sort:c}}function r0(){let s=new WeakMap;function e(n,i){let r=s.get(n),a;return r===void 0?(a=new uc,s.set(n,[a])):i>=r.length?(a=new uc,r.push(a)):a=r[i],a}function t(){s=new WeakMap}return{get:e,dispose:t}}function o0(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Xe};break;case"SpotLight":t={position:new L,direction:new L,color:new Xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Xe,groundColor:new Xe};break;case"RectAreaLight":t={color:new Xe,position:new L,halfWidth:new L,halfHeight:new L};break}return s[e.id]=t,t}}}function a0(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Te,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}function c0(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function h0(s,e){let t=new o0,n=a0(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)i.probe.push(new L);let r=new L,a=new nt,o=new nt;function l(h,u){let d=0,p=0,g=0;for(let X=0;X<9;X++)i.probe[X].set(0,0,0);let x=0,m=0,f=0,b=0,_=0,M=0,S=0,R=0,E=0,N=0,v=0;h.sort(c0);let T=u===!0?Math.PI:1;for(let X=0,j=h.length;X<j;X++){let I=h[X],U=I.color,V=I.intensity,Y=I.distance,q=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)d+=U.r*V*T,p+=U.g*V*T,g+=U.b*V*T;else if(I.isLightProbe){for(let W=0;W<9;W++)i.probe[W].addScaledVector(I.sh.coefficients[W],V);v++}else if(I.isDirectionalLight){let W=t.get(I);if(W.color.copy(I.color).multiplyScalar(I.intensity*T),I.castShadow){let Q=I.shadow,ne=n.get(I);ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,i.directionalShadow[x]=ne,i.directionalShadowMap[x]=q,i.directionalShadowMatrix[x]=I.shadow.matrix,M++}i.directional[x]=W,x++}else if(I.isSpotLight){let W=t.get(I);W.position.setFromMatrixPosition(I.matrixWorld),W.color.copy(U).multiplyScalar(V*T),W.distance=Y,W.coneCos=Math.cos(I.angle),W.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),W.decay=I.decay,i.spot[f]=W;let Q=I.shadow;if(I.map&&(i.spotLightMap[E]=I.map,E++,Q.updateMatrices(I),I.castShadow&&N++),i.spotLightMatrix[f]=Q.matrix,I.castShadow){let ne=n.get(I);ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,i.spotShadow[f]=ne,i.spotShadowMap[f]=q,R++}f++}else if(I.isRectAreaLight){let W=t.get(I);W.color.copy(U).multiplyScalar(V),W.halfWidth.set(I.width*.5,0,0),W.halfHeight.set(0,I.height*.5,0),i.rectArea[b]=W,b++}else if(I.isPointLight){let W=t.get(I);if(W.color.copy(I.color).multiplyScalar(I.intensity*T),W.distance=I.distance,W.decay=I.decay,I.castShadow){let Q=I.shadow,ne=n.get(I);ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,ne.shadowCameraNear=Q.camera.near,ne.shadowCameraFar=Q.camera.far,i.pointShadow[m]=ne,i.pointShadowMap[m]=q,i.pointShadowMatrix[m]=I.shadow.matrix,S++}i.point[m]=W,m++}else if(I.isHemisphereLight){let W=t.get(I);W.skyColor.copy(I.color).multiplyScalar(V*T),W.groundColor.copy(I.groundColor).multiplyScalar(V*T),i.hemi[_]=W,_++}}b>0&&(e.isWebGL2?s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2):s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=d,i.ambient[1]=p,i.ambient[2]=g;let F=i.hash;(F.directionalLength!==x||F.pointLength!==m||F.spotLength!==f||F.rectAreaLength!==b||F.hemiLength!==_||F.numDirectionalShadows!==M||F.numPointShadows!==S||F.numSpotShadows!==R||F.numSpotMaps!==E||F.numLightProbes!==v)&&(i.directional.length=x,i.spot.length=f,i.rectArea.length=b,i.point.length=m,i.hemi.length=_,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=S,i.pointShadowMap.length=S,i.spotShadow.length=R,i.spotShadowMap.length=R,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=S,i.spotLightMatrix.length=R+E-N,i.spotLightMap.length=E,i.numSpotLightShadowsWithMaps=N,i.numLightProbes=v,F.directionalLength=x,F.pointLength=m,F.spotLength=f,F.rectAreaLength=b,F.hemiLength=_,F.numDirectionalShadows=M,F.numPointShadows=S,F.numSpotShadows=R,F.numSpotMaps=E,F.numLightProbes=v,i.version=l0++)}function c(h,u){let d=0,p=0,g=0,x=0,m=0,f=u.matrixWorldInverse;for(let b=0,_=h.length;b<_;b++){let M=h[b];if(M.isDirectionalLight){let S=i.directional[d];S.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(f),d++}else if(M.isSpotLight){let S=i.spot[g];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(f),S.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(f),g++}else if(M.isRectAreaLight){let S=i.rectArea[x];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(f),o.identity(),a.copy(M.matrixWorld),a.premultiply(f),o.extractRotation(a),S.halfWidth.set(M.width*.5,0,0),S.halfHeight.set(0,M.height*.5,0),S.halfWidth.applyMatrix4(o),S.halfHeight.applyMatrix4(o),x++}else if(M.isPointLight){let S=i.point[p];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(f),p++}else if(M.isHemisphereLight){let S=i.hemi[m];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(f),m++}}}return{setup:l,setupView:c,state:i}}function dc(s,e){let t=new h0(s,e),n=[],i=[];function r(){n.length=0,i.length=0}function a(u){n.push(u)}function o(u){i.push(u)}function l(u){t.setup(n,u)}function c(u){t.setupView(n,u)}return{init:r,state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function u0(s,e){let t=new WeakMap;function n(r,a=0){let o=t.get(r),l;return o===void 0?(l=new dc(s,e),t.set(r,[l])):a>=o.length?(l=new dc(s,e),o.push(l)):l=o[a],l}function i(){t=new WeakMap}return{get:n,dispose:i}}function p0(s,e,t){let n=new Oi,i=new Te,r=new Te,a=new gt,o=new ta({depthPacking:sd}),l=new na,c={},h=t.maxTextureSize,u={[On]:It,[It]:On,[jt]:jt},d=new En({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Te},radius:{value:4}},vertexShader:d0,fragmentShader:f0}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let g=new cn;g.setAttribute("position",new Bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new Xt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=gc;let f=this.type;this.render=function(R,E,N){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;let v=s.getRenderTarget(),T=s.getActiveCubeFace(),F=s.getActiveMipmapLevel(),X=s.state;X.setBlending(Un),X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);let j=f!==Mn&&this.type===Mn,I=f===Mn&&this.type!==Mn;for(let U=0,V=R.length;U<V;U++){let Y=R[U],q=Y.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;i.copy(q.mapSize);let W=q.getFrameExtents();if(i.multiply(W),r.copy(q.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/W.x),i.x=r.x*W.x,q.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/W.y),i.y=r.y*W.y,q.mapSize.y=r.y)),q.map===null||j===!0||I===!0){let ne=this.type!==Mn?{minFilter:ot,magFilter:ot}:{};q.map!==null&&q.map.dispose(),q.map=new bn(i.x,i.y,ne),q.map.texture.name=Y.name+".shadowMap",q.camera.updateProjectionMatrix()}s.setRenderTarget(q.map),s.clear();let Q=q.getViewportCount();for(let ne=0;ne<Q;ne++){let ue=q.getViewport(ne);a.set(r.x*ue.x,r.y*ue.y,r.x*ue.z,r.y*ue.w),X.viewport(a),q.updateMatrices(Y,ne),n=q.getFrustum(),M(E,N,q.camera,Y,this.type)}q.isPointLightShadow!==!0&&this.type===Mn&&b(q,N),q.needsUpdate=!1}f=this.type,m.needsUpdate=!1,s.setRenderTarget(v,T,F)};function b(R,E){let N=e.update(x);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,p.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new bn(i.x,i.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,s.setRenderTarget(R.mapPass),s.clear(),s.renderBufferDirect(E,null,N,d,x,null),p.uniforms.shadow_pass.value=R.mapPass.texture,p.uniforms.resolution.value=R.mapSize,p.uniforms.radius.value=R.radius,s.setRenderTarget(R.map),s.clear(),s.renderBufferDirect(E,null,N,p,x,null)}function _(R,E,N,v){let T=null,F=N.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(F!==void 0)T=F;else if(T=N.isPointLight===!0?l:o,s.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){let X=T.uuid,j=E.uuid,I=c[X];I===void 0&&(I={},c[X]=I);let U=I[j];U===void 0&&(U=T.clone(),I[j]=U,E.addEventListener("dispose",S)),T=U}if(T.visible=E.visible,T.wireframe=E.wireframe,v===Mn?T.side=E.shadowSide!==null?E.shadowSide:E.side:T.side=E.shadowSide!==null?E.shadowSide:u[E.side],T.alphaMap=E.alphaMap,T.alphaTest=E.alphaTest,T.map=E.map,T.clipShadows=E.clipShadows,T.clippingPlanes=E.clippingPlanes,T.clipIntersection=E.clipIntersection,T.displacementMap=E.displacementMap,T.displacementScale=E.displacementScale,T.displacementBias=E.displacementBias,T.wireframeLinewidth=E.wireframeLinewidth,T.linewidth=E.linewidth,N.isPointLight===!0&&T.isMeshDistanceMaterial===!0){let X=s.properties.get(T);X.light=N}return T}function M(R,E,N,v,T){if(R.visible===!1)return;if(R.layers.test(E.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&T===Mn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,R.matrixWorld);let j=e.update(R),I=R.material;if(Array.isArray(I)){let U=j.groups;for(let V=0,Y=U.length;V<Y;V++){let q=U[V],W=I[q.materialIndex];if(W&&W.visible){let Q=_(R,W,v,T);R.onBeforeShadow(s,R,E,N,j,Q,q),s.renderBufferDirect(N,null,j,Q,R,q),R.onAfterShadow(s,R,E,N,j,Q,q)}}}else if(I.visible){let U=_(R,I,v,T);R.onBeforeShadow(s,R,E,N,j,U,null),s.renderBufferDirect(N,null,j,U,R,null),R.onAfterShadow(s,R,E,N,j,U,null)}}let X=R.children;for(let j=0,I=X.length;j<I;j++)M(X[j],E,N,v,T)}function S(R){R.target.removeEventListener("dispose",S);for(let N in c){let v=c[N],T=R.target.uuid;T in v&&(v[T].dispose(),delete v[T])}}}function m0(s,e,t){let n=t.isWebGL2;function i(){let P=!1,se=new gt,re=null,Se=new gt(0,0,0,0);return{setMask:function(ye){re!==ye&&!P&&(s.colorMask(ye,ye,ye,ye),re=ye)},setLocked:function(ye){P=ye},setClear:function(ye,Ye,qe,dt,bt){bt===!0&&(ye*=dt,Ye*=dt,qe*=dt),se.set(ye,Ye,qe,dt),Se.equals(se)===!1&&(s.clearColor(ye,Ye,qe,dt),Se.copy(se))},reset:function(){P=!1,re=null,Se.set(-1,0,0,0)}}}function r(){let P=!1,se=null,re=null,Se=null;return{setTest:function(ye){ye?Pe(s.DEPTH_TEST):be(s.DEPTH_TEST)},setMask:function(ye){se!==ye&&!P&&(s.depthMask(ye),se=ye)},setFunc:function(ye){if(re!==ye){switch(ye){case Du:s.depthFunc(s.NEVER);break;case Uu:s.depthFunc(s.ALWAYS);break;case Nu:s.depthFunc(s.LESS);break;case Ys:s.depthFunc(s.LEQUAL);break;case Fu:s.depthFunc(s.EQUAL);break;case Ou:s.depthFunc(s.GEQUAL);break;case Bu:s.depthFunc(s.GREATER);break;case zu:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}re=ye}},setLocked:function(ye){P=ye},setClear:function(ye){Se!==ye&&(s.clearDepth(ye),Se=ye)},reset:function(){P=!1,se=null,re=null,Se=null}}}function a(){let P=!1,se=null,re=null,Se=null,ye=null,Ye=null,qe=null,dt=null,bt=null;return{setTest:function(Ze){P||(Ze?Pe(s.STENCIL_TEST):be(s.STENCIL_TEST))},setMask:function(Ze){se!==Ze&&!P&&(s.stencilMask(Ze),se=Ze)},setFunc:function(Ze,Et,on){(re!==Ze||Se!==Et||ye!==on)&&(s.stencilFunc(Ze,Et,on),re=Ze,Se=Et,ye=on)},setOp:function(Ze,Et,on){(Ye!==Ze||qe!==Et||dt!==on)&&(s.stencilOp(Ze,Et,on),Ye=Ze,qe=Et,dt=on)},setLocked:function(Ze){P=Ze},setClear:function(Ze){bt!==Ze&&(s.clearStencil(Ze),bt=Ze)},reset:function(){P=!1,se=null,re=null,Se=null,ye=null,Ye=null,qe=null,dt=null,bt=null}}}let o=new i,l=new r,c=new a,h=new WeakMap,u=new WeakMap,d={},p={},g=new WeakMap,x=[],m=null,f=!1,b=null,_=null,M=null,S=null,R=null,E=null,N=null,v=new Xe(0,0,0),T=0,F=!1,X=null,j=null,I=null,U=null,V=null,Y=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),q=!1,W=0,Q=s.getParameter(s.VERSION);Q.indexOf("WebGL")!==-1?(W=parseFloat(/^WebGL (\d)/.exec(Q)[1]),q=W>=1):Q.indexOf("OpenGL ES")!==-1&&(W=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),q=W>=2);let ne=null,ue={},G=s.getParameter(s.SCISSOR_BOX),Z=s.getParameter(s.VIEWPORT),he=new gt().fromArray(G),_e=new gt().fromArray(Z);function ge(P,se,re,Se){let ye=new Uint8Array(4),Ye=s.createTexture();s.bindTexture(P,Ye),s.texParameteri(P,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(P,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let qe=0;qe<re;qe++)n&&(P===s.TEXTURE_3D||P===s.TEXTURE_2D_ARRAY)?s.texImage3D(se,0,s.RGBA,1,1,Se,0,s.RGBA,s.UNSIGNED_BYTE,ye):s.texImage2D(se+qe,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,ye);return Ye}let Ce={};Ce[s.TEXTURE_2D]=ge(s.TEXTURE_2D,s.TEXTURE_2D,1),Ce[s.TEXTURE_CUBE_MAP]=ge(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(Ce[s.TEXTURE_2D_ARRAY]=ge(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),Ce[s.TEXTURE_3D]=ge(s.TEXTURE_3D,s.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Pe(s.DEPTH_TEST),l.setFunc(Ys),Ie(!1),A(Za),Pe(s.CULL_FACE),pe(Un);function Pe(P){d[P]!==!0&&(s.enable(P),d[P]=!0)}function be(P){d[P]!==!1&&(s.disable(P),d[P]=!1)}function Ge(P,se){return p[P]!==se?(s.bindFramebuffer(P,se),p[P]=se,n&&(P===s.DRAW_FRAMEBUFFER&&(p[s.FRAMEBUFFER]=se),P===s.FRAMEBUFFER&&(p[s.DRAW_FRAMEBUFFER]=se)),!0):!1}function O(P,se){let re=x,Se=!1;if(P)if(re=g.get(se),re===void 0&&(re=[],g.set(se,re)),P.isWebGLMultipleRenderTargets){let ye=P.texture;if(re.length!==ye.length||re[0]!==s.COLOR_ATTACHMENT0){for(let Ye=0,qe=ye.length;Ye<qe;Ye++)re[Ye]=s.COLOR_ATTACHMENT0+Ye;re.length=ye.length,Se=!0}}else re[0]!==s.COLOR_ATTACHMENT0&&(re[0]=s.COLOR_ATTACHMENT0,Se=!0);else re[0]!==s.BACK&&(re[0]=s.BACK,Se=!0);Se&&(t.isWebGL2?s.drawBuffers(re):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(re))}function ut(P){return m!==P?(s.useProgram(P),m=P,!0):!1}let Me={[Zn]:s.FUNC_ADD,[_u]:s.FUNC_SUBTRACT,[yu]:s.FUNC_REVERSE_SUBTRACT};if(n)Me[Qa]=s.MIN,Me[el]=s.MAX;else{let P=e.get("EXT_blend_minmax");P!==null&&(Me[Qa]=P.MIN_EXT,Me[el]=P.MAX_EXT)}let Ae={[vu]:s.ZERO,[Mu]:s.ONE,[Su]:s.SRC_COLOR,[No]:s.SRC_ALPHA,[Ru]:s.SRC_ALPHA_SATURATE,[Tu]:s.DST_COLOR,[Eu]:s.DST_ALPHA,[bu]:s.ONE_MINUS_SRC_COLOR,[Fo]:s.ONE_MINUS_SRC_ALPHA,[Au]:s.ONE_MINUS_DST_COLOR,[wu]:s.ONE_MINUS_DST_ALPHA,[Cu]:s.CONSTANT_COLOR,[Pu]:s.ONE_MINUS_CONSTANT_COLOR,[Iu]:s.CONSTANT_ALPHA,[Lu]:s.ONE_MINUS_CONSTANT_ALPHA};function pe(P,se,re,Se,ye,Ye,qe,dt,bt,Ze){if(P===Un){f===!0&&(be(s.BLEND),f=!1);return}if(f===!1&&(Pe(s.BLEND),f=!0),P!==xu){if(P!==b||Ze!==F){if((_!==Zn||R!==Zn)&&(s.blendEquation(s.FUNC_ADD),_=Zn,R=Zn),Ze)switch(P){case Ri:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ka:s.blendFunc(s.ONE,s.ONE);break;case Ja:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case ja:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case Ri:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ka:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case Ja:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case ja:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}M=null,S=null,E=null,N=null,v.set(0,0,0),T=0,b=P,F=Ze}return}ye=ye||se,Ye=Ye||re,qe=qe||Se,(se!==_||ye!==R)&&(s.blendEquationSeparate(Me[se],Me[ye]),_=se,R=ye),(re!==M||Se!==S||Ye!==E||qe!==N)&&(s.blendFuncSeparate(Ae[re],Ae[Se],Ae[Ye],Ae[qe]),M=re,S=Se,E=Ye,N=qe),(dt.equals(v)===!1||bt!==T)&&(s.blendColor(dt.r,dt.g,dt.b,bt),v.copy(dt),T=bt),b=P,F=!1}function Ke(P,se){P.side===jt?be(s.CULL_FACE):Pe(s.CULL_FACE);let re=P.side===It;se&&(re=!re),Ie(re),P.blending===Ri&&P.transparent===!1?pe(Un):pe(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),l.setFunc(P.depthFunc),l.setTest(P.depthTest),l.setMask(P.depthWrite),o.setMask(P.colorWrite);let Se=P.stencilWrite;c.setTest(Se),Se&&(c.setMask(P.stencilWriteMask),c.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),c.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),B(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?Pe(s.SAMPLE_ALPHA_TO_COVERAGE):be(s.SAMPLE_ALPHA_TO_COVERAGE)}function Ie(P){X!==P&&(P?s.frontFace(s.CW):s.frontFace(s.CCW),X=P)}function A(P){P!==pu?(Pe(s.CULL_FACE),P!==j&&(P===Za?s.cullFace(s.BACK):P===mu?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):be(s.CULL_FACE),j=P}function y(P){P!==I&&(q&&s.lineWidth(P),I=P)}function B(P,se,re){P?(Pe(s.POLYGON_OFFSET_FILL),(U!==se||V!==re)&&(s.polygonOffset(se,re),U=se,V=re)):be(s.POLYGON_OFFSET_FILL)}function te(P){P?Pe(s.SCISSOR_TEST):be(s.SCISSOR_TEST)}function J(P){P===void 0&&(P=s.TEXTURE0+Y-1),ne!==P&&(s.activeTexture(P),ne=P)}function ee(P,se,re){re===void 0&&(ne===null?re=s.TEXTURE0+Y-1:re=ne);let Se=ue[re];Se===void 0&&(Se={type:void 0,texture:void 0},ue[re]=Se),(Se.type!==P||Se.texture!==se)&&(ne!==re&&(s.activeTexture(re),ne=re),s.bindTexture(P,se||Ce[P]),Se.type=P,Se.texture=se)}function me(){let P=ue[ne];P!==void 0&&P.type!==void 0&&(s.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function ce(){try{s.compressedTexImage2D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function fe(){try{s.compressedTexImage3D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ee(){try{s.texSubImage2D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function De(){try{s.texSubImage3D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function K(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ve(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function C(){try{s.texStorage2D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function $(){try{s.texStorage3D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ae(){try{s.texImage2D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ie(){try{s.texImage3D.apply(s,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function xe(P){he.equals(P)===!1&&(s.scissor(P.x,P.y,P.z,P.w),he.copy(P))}function ze(P){_e.equals(P)===!1&&(s.viewport(P.x,P.y,P.z,P.w),_e.copy(P))}function We(P,se){let re=u.get(se);re===void 0&&(re=new WeakMap,u.set(se,re));let Se=re.get(P);Se===void 0&&(Se=s.getUniformBlockIndex(se,P.name),re.set(P,Se))}function Oe(P,se){let Se=u.get(se).get(P);h.get(se)!==Se&&(s.uniformBlockBinding(se,Se,P.__bindingPointIndex),h.set(se,Se))}function oe(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),n===!0&&(s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),d={},ne=null,ue={},p={},g=new WeakMap,x=[],m=null,f=!1,b=null,_=null,M=null,S=null,R=null,E=null,N=null,v=new Xe(0,0,0),T=0,F=!1,X=null,j=null,I=null,U=null,V=null,he.set(0,0,s.canvas.width,s.canvas.height),_e.set(0,0,s.canvas.width,s.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:Pe,disable:be,bindFramebuffer:Ge,drawBuffers:O,useProgram:ut,setBlending:pe,setMaterial:Ke,setFlipSided:Ie,setCullFace:A,setLineWidth:y,setPolygonOffset:B,setScissorTest:te,activeTexture:J,bindTexture:ee,unbindTexture:me,compressedTexImage2D:ce,compressedTexImage3D:fe,texImage2D:ae,texImage3D:ie,updateUBOMapping:We,uniformBlockBinding:Oe,texStorage2D:C,texStorage3D:$,texSubImage2D:Ee,texSubImage3D:De,compressedTexSubImage2D:K,compressedTexSubImage3D:Ve,scissor:xe,viewport:ze,reset:oe}}function g0(s,e,t,n,i,r,a){let o=i.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,y){return p?new OffscreenCanvas(A,y):sr("canvas")}function x(A,y,B,te){let J=1;if((A.width>te||A.height>te)&&(J=te/Math.max(A.width,A.height)),J<1||y===!0)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){let ee=y?ir:Math.floor,me=ee(J*A.width),ce=ee(J*A.height);u===void 0&&(u=g(me,ce));let fe=B?g(me,ce):u;return fe.width=me,fe.height=ce,fe.getContext("2d").drawImage(A,0,0,me,ce),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+A.width+"x"+A.height+") to ("+me+"x"+ce+")."),fe}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+A.width+"x"+A.height+")."),A;return A}function m(A){return Go(A.width)&&Go(A.height)}function f(A){return o?!1:A.wrapS!==Qt||A.wrapT!==Qt||A.minFilter!==ot&&A.minFilter!==At}function b(A,y){return A.generateMipmaps&&y&&A.minFilter!==ot&&A.minFilter!==At}function _(A){s.generateMipmap(A)}function M(A,y,B,te,J=!1){if(o===!1)return y;if(A!==null){if(s[A]!==void 0)return s[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ee=y;if(y===s.RED&&(B===s.FLOAT&&(ee=s.R32F),B===s.HALF_FLOAT&&(ee=s.R16F),B===s.UNSIGNED_BYTE&&(ee=s.R8)),y===s.RED_INTEGER&&(B===s.UNSIGNED_BYTE&&(ee=s.R8UI),B===s.UNSIGNED_SHORT&&(ee=s.R16UI),B===s.UNSIGNED_INT&&(ee=s.R32UI),B===s.BYTE&&(ee=s.R8I),B===s.SHORT&&(ee=s.R16I),B===s.INT&&(ee=s.R32I)),y===s.RG&&(B===s.FLOAT&&(ee=s.RG32F),B===s.HALF_FLOAT&&(ee=s.RG16F),B===s.UNSIGNED_BYTE&&(ee=s.RG8)),y===s.RGBA){let me=J?Qs:$e.getTransfer(te);B===s.FLOAT&&(ee=s.RGBA32F),B===s.HALF_FLOAT&&(ee=s.RGBA16F),B===s.UNSIGNED_BYTE&&(ee=me===Je?s.SRGB8_ALPHA8:s.RGBA8),B===s.UNSIGNED_SHORT_4_4_4_4&&(ee=s.RGBA4),B===s.UNSIGNED_SHORT_5_5_5_1&&(ee=s.RGB5_A1)}return(ee===s.R16F||ee===s.R32F||ee===s.RG16F||ee===s.RG32F||ee===s.RGBA16F||ee===s.RGBA32F)&&e.get("EXT_color_buffer_float"),ee}function S(A,y,B){return b(A,B)===!0||A.isFramebufferTexture&&A.minFilter!==ot&&A.minFilter!==At?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function R(A){return A===ot||A===tl||A===ao?s.NEAREST:s.LINEAR}function E(A){let y=A.target;y.removeEventListener("dispose",E),v(y),y.isVideoTexture&&h.delete(y)}function N(A){let y=A.target;y.removeEventListener("dispose",N),F(y)}function v(A){let y=n.get(A);if(y.__webglInit===void 0)return;let B=A.source,te=d.get(B);if(te){let J=te[y.__cacheKey];J.usedTimes--,J.usedTimes===0&&T(A),Object.keys(te).length===0&&d.delete(B)}n.remove(A)}function T(A){let y=n.get(A);s.deleteTexture(y.__webglTexture);let B=A.source,te=d.get(B);delete te[y.__cacheKey],a.memory.textures--}function F(A){let y=A.texture,B=n.get(A),te=n.get(y);if(te.__webglTexture!==void 0&&(s.deleteTexture(te.__webglTexture),a.memory.textures--),A.depthTexture&&A.depthTexture.dispose(),A.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(B.__webglFramebuffer[J]))for(let ee=0;ee<B.__webglFramebuffer[J].length;ee++)s.deleteFramebuffer(B.__webglFramebuffer[J][ee]);else s.deleteFramebuffer(B.__webglFramebuffer[J]);B.__webglDepthbuffer&&s.deleteRenderbuffer(B.__webglDepthbuffer[J])}else{if(Array.isArray(B.__webglFramebuffer))for(let J=0;J<B.__webglFramebuffer.length;J++)s.deleteFramebuffer(B.__webglFramebuffer[J]);else s.deleteFramebuffer(B.__webglFramebuffer);if(B.__webglDepthbuffer&&s.deleteRenderbuffer(B.__webglDepthbuffer),B.__webglMultisampledFramebuffer&&s.deleteFramebuffer(B.__webglMultisampledFramebuffer),B.__webglColorRenderbuffer)for(let J=0;J<B.__webglColorRenderbuffer.length;J++)B.__webglColorRenderbuffer[J]&&s.deleteRenderbuffer(B.__webglColorRenderbuffer[J]);B.__webglDepthRenderbuffer&&s.deleteRenderbuffer(B.__webglDepthRenderbuffer)}if(A.isWebGLMultipleRenderTargets)for(let J=0,ee=y.length;J<ee;J++){let me=n.get(y[J]);me.__webglTexture&&(s.deleteTexture(me.__webglTexture),a.memory.textures--),n.remove(y[J])}n.remove(y),n.remove(A)}let X=0;function j(){X=0}function I(){let A=X;return A>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+i.maxTextures),X+=1,A}function U(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function V(A,y){let B=n.get(A);if(A.isVideoTexture&&Ke(A),A.isRenderTargetTexture===!1&&A.version>0&&B.__version!==A.version){let te=A.image;if(te===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(te.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{he(B,A,y);return}}t.bindTexture(s.TEXTURE_2D,B.__webglTexture,s.TEXTURE0+y)}function Y(A,y){let B=n.get(A);if(A.version>0&&B.__version!==A.version){he(B,A,y);return}t.bindTexture(s.TEXTURE_2D_ARRAY,B.__webglTexture,s.TEXTURE0+y)}function q(A,y){let B=n.get(A);if(A.version>0&&B.__version!==A.version){he(B,A,y);return}t.bindTexture(s.TEXTURE_3D,B.__webglTexture,s.TEXTURE0+y)}function W(A,y){let B=n.get(A);if(A.version>0&&B.__version!==A.version){_e(B,A,y);return}t.bindTexture(s.TEXTURE_CUBE_MAP,B.__webglTexture,s.TEXTURE0+y)}let Q={[zo]:s.REPEAT,[Qt]:s.CLAMP_TO_EDGE,[ko]:s.MIRRORED_REPEAT},ne={[ot]:s.NEAREST,[tl]:s.NEAREST_MIPMAP_NEAREST,[ao]:s.NEAREST_MIPMAP_LINEAR,[At]:s.LINEAR,[$u]:s.LINEAR_MIPMAP_NEAREST,[ei]:s.LINEAR_MIPMAP_LINEAR},ue={[ad]:s.NEVER,[fd]:s.ALWAYS,[ld]:s.LESS,[Tc]:s.LEQUAL,[cd]:s.EQUAL,[dd]:s.GEQUAL,[hd]:s.GREATER,[ud]:s.NOTEQUAL};function G(A,y,B){if(B?(s.texParameteri(A,s.TEXTURE_WRAP_S,Q[y.wrapS]),s.texParameteri(A,s.TEXTURE_WRAP_T,Q[y.wrapT]),(A===s.TEXTURE_3D||A===s.TEXTURE_2D_ARRAY)&&s.texParameteri(A,s.TEXTURE_WRAP_R,Q[y.wrapR]),s.texParameteri(A,s.TEXTURE_MAG_FILTER,ne[y.magFilter]),s.texParameteri(A,s.TEXTURE_MIN_FILTER,ne[y.minFilter])):(s.texParameteri(A,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(A,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),(A===s.TEXTURE_3D||A===s.TEXTURE_2D_ARRAY)&&s.texParameteri(A,s.TEXTURE_WRAP_R,s.CLAMP_TO_EDGE),(y.wrapS!==Qt||y.wrapT!==Qt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(A,s.TEXTURE_MAG_FILTER,R(y.magFilter)),s.texParameteri(A,s.TEXTURE_MIN_FILTER,R(y.minFilter)),y.minFilter!==ot&&y.minFilter!==At&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),y.compareFunction&&(s.texParameteri(A,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(A,s.TEXTURE_COMPARE_FUNC,ue[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){let te=e.get("EXT_texture_filter_anisotropic");if(y.magFilter===ot||y.minFilter!==ao&&y.minFilter!==ei||y.type===Dn&&e.has("OES_texture_float_linear")===!1||o===!1&&y.type===ss&&e.has("OES_texture_half_float_linear")===!1)return;(y.anisotropy>1||n.get(y).__currentAnisotropy)&&(s.texParameterf(A,te.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,i.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy)}}function Z(A,y){let B=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",E));let te=y.source,J=d.get(te);J===void 0&&(J={},d.set(te,J));let ee=U(y);if(ee!==A.__cacheKey){J[ee]===void 0&&(J[ee]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,B=!0),J[ee].usedTimes++;let me=J[A.__cacheKey];me!==void 0&&(J[A.__cacheKey].usedTimes--,me.usedTimes===0&&T(y)),A.__cacheKey=ee,A.__webglTexture=J[ee].texture}return B}function he(A,y,B){let te=s.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(te=s.TEXTURE_2D_ARRAY),y.isData3DTexture&&(te=s.TEXTURE_3D);let J=Z(A,y),ee=y.source;t.bindTexture(te,A.__webglTexture,s.TEXTURE0+B);let me=n.get(ee);if(ee.version!==me.__version||J===!0){t.activeTexture(s.TEXTURE0+B);let ce=$e.getPrimaries($e.workingColorSpace),fe=y.colorSpace===Wt?null:$e.getPrimaries(y.colorSpace),Ee=y.colorSpace===Wt||ce===fe?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,y.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,y.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);let De=f(y)&&m(y.image)===!1,K=x(y.image,De,!1,i.maxTextureSize);K=Ie(y,K);let Ve=m(K)||o,C=r.convert(y.format,y.colorSpace),$=r.convert(y.type),ae=M(y.internalFormat,C,$,y.colorSpace,y.isVideoTexture);G(te,y,Ve);let ie,xe=y.mipmaps,ze=o&&y.isVideoTexture!==!0&&ae!==Sr,We=me.__version===void 0||J===!0,Oe=S(y,K,Ve);if(y.isDepthTexture)ae=s.DEPTH_COMPONENT,o?y.type===Dn?ae=s.DEPTH_COMPONENT32F:y.type===Ln?ae=s.DEPTH_COMPONENT24:y.type===Jn?ae=s.DEPTH24_STENCIL8:ae=s.DEPTH_COMPONENT16:y.type===Dn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),y.format===jn&&ae===s.DEPTH_COMPONENT&&y.type!==xa&&y.type!==Ln&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),y.type=Ln,$=r.convert(y.type)),y.format===Di&&ae===s.DEPTH_COMPONENT&&(ae=s.DEPTH_STENCIL,y.type!==Jn&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),y.type=Jn,$=r.convert(y.type))),We&&(ze?t.texStorage2D(s.TEXTURE_2D,1,ae,K.width,K.height):t.texImage2D(s.TEXTURE_2D,0,ae,K.width,K.height,0,C,$,null));else if(y.isDataTexture)if(xe.length>0&&Ve){ze&&We&&t.texStorage2D(s.TEXTURE_2D,Oe,ae,xe[0].width,xe[0].height);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],ze?t.texSubImage2D(s.TEXTURE_2D,oe,0,0,ie.width,ie.height,C,$,ie.data):t.texImage2D(s.TEXTURE_2D,oe,ae,ie.width,ie.height,0,C,$,ie.data);y.generateMipmaps=!1}else ze?(We&&t.texStorage2D(s.TEXTURE_2D,Oe,ae,K.width,K.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,K.width,K.height,C,$,K.data)):t.texImage2D(s.TEXTURE_2D,0,ae,K.width,K.height,0,C,$,K.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){ze&&We&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Oe,ae,xe[0].width,xe[0].height,K.depth);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],y.format!==Ot?C!==null?ze?t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,oe,0,0,0,ie.width,ie.height,K.depth,C,ie.data,0,0):t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,oe,ae,ie.width,ie.height,K.depth,0,ie.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ze?t.texSubImage3D(s.TEXTURE_2D_ARRAY,oe,0,0,0,ie.width,ie.height,K.depth,C,$,ie.data):t.texImage3D(s.TEXTURE_2D_ARRAY,oe,ae,ie.width,ie.height,K.depth,0,C,$,ie.data)}else{ze&&We&&t.texStorage2D(s.TEXTURE_2D,Oe,ae,xe[0].width,xe[0].height);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],y.format!==Ot?C!==null?ze?t.compressedTexSubImage2D(s.TEXTURE_2D,oe,0,0,ie.width,ie.height,C,ie.data):t.compressedTexImage2D(s.TEXTURE_2D,oe,ae,ie.width,ie.height,0,ie.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ze?t.texSubImage2D(s.TEXTURE_2D,oe,0,0,ie.width,ie.height,C,$,ie.data):t.texImage2D(s.TEXTURE_2D,oe,ae,ie.width,ie.height,0,C,$,ie.data)}else if(y.isDataArrayTexture)ze?(We&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Oe,ae,K.width,K.height,K.depth),t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,C,$,K.data)):t.texImage3D(s.TEXTURE_2D_ARRAY,0,ae,K.width,K.height,K.depth,0,C,$,K.data);else if(y.isData3DTexture)ze?(We&&t.texStorage3D(s.TEXTURE_3D,Oe,ae,K.width,K.height,K.depth),t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,C,$,K.data)):t.texImage3D(s.TEXTURE_3D,0,ae,K.width,K.height,K.depth,0,C,$,K.data);else if(y.isFramebufferTexture){if(We)if(ze)t.texStorage2D(s.TEXTURE_2D,Oe,ae,K.width,K.height);else{let oe=K.width,P=K.height;for(let se=0;se<Oe;se++)t.texImage2D(s.TEXTURE_2D,se,ae,oe,P,0,C,$,null),oe>>=1,P>>=1}}else if(xe.length>0&&Ve){ze&&We&&t.texStorage2D(s.TEXTURE_2D,Oe,ae,xe[0].width,xe[0].height);for(let oe=0,P=xe.length;oe<P;oe++)ie=xe[oe],ze?t.texSubImage2D(s.TEXTURE_2D,oe,0,0,C,$,ie):t.texImage2D(s.TEXTURE_2D,oe,ae,C,$,ie);y.generateMipmaps=!1}else ze?(We&&t.texStorage2D(s.TEXTURE_2D,Oe,ae,K.width,K.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,C,$,K)):t.texImage2D(s.TEXTURE_2D,0,ae,C,$,K);b(y,Ve)&&_(te),me.__version=ee.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function _e(A,y,B){if(y.image.length!==6)return;let te=Z(A,y),J=y.source;t.bindTexture(s.TEXTURE_CUBE_MAP,A.__webglTexture,s.TEXTURE0+B);let ee=n.get(J);if(J.version!==ee.__version||te===!0){t.activeTexture(s.TEXTURE0+B);let me=$e.getPrimaries($e.workingColorSpace),ce=y.colorSpace===Wt?null:$e.getPrimaries(y.colorSpace),fe=y.colorSpace===Wt||me===ce?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,y.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,y.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);let Ee=y.isCompressedTexture||y.image[0].isCompressedTexture,De=y.image[0]&&y.image[0].isDataTexture,K=[];for(let oe=0;oe<6;oe++)!Ee&&!De?K[oe]=x(y.image[oe],!1,!0,i.maxCubemapSize):K[oe]=De?y.image[oe].image:y.image[oe],K[oe]=Ie(y,K[oe]);let Ve=K[0],C=m(Ve)||o,$=r.convert(y.format,y.colorSpace),ae=r.convert(y.type),ie=M(y.internalFormat,$,ae,y.colorSpace),xe=o&&y.isVideoTexture!==!0,ze=ee.__version===void 0||te===!0,We=S(y,Ve,C);G(s.TEXTURE_CUBE_MAP,y,C);let Oe;if(Ee){xe&&ze&&t.texStorage2D(s.TEXTURE_CUBE_MAP,We,ie,Ve.width,Ve.height);for(let oe=0;oe<6;oe++){Oe=K[oe].mipmaps;for(let P=0;P<Oe.length;P++){let se=Oe[P];y.format!==Ot?$!==null?xe?t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,0,0,se.width,se.height,$,se.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,ie,se.width,se.height,0,se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):xe?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,0,0,se.width,se.height,$,ae,se.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P,ie,se.width,se.height,0,$,ae,se.data)}}}else{Oe=y.mipmaps,xe&&ze&&(Oe.length>0&&We++,t.texStorage2D(s.TEXTURE_CUBE_MAP,We,ie,K[0].width,K[0].height));for(let oe=0;oe<6;oe++)if(De){xe?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,K[oe].width,K[oe].height,$,ae,K[oe].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,ie,K[oe].width,K[oe].height,0,$,ae,K[oe].data);for(let P=0;P<Oe.length;P++){let re=Oe[P].image[oe].image;xe?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,0,0,re.width,re.height,$,ae,re.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,ie,re.width,re.height,0,$,ae,re.data)}}else{xe?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,$,ae,K[oe]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,ie,$,ae,K[oe]);for(let P=0;P<Oe.length;P++){let se=Oe[P];xe?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,0,0,$,ae,se.image[oe]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,P+1,ie,$,ae,se.image[oe])}}}b(y,C)&&_(s.TEXTURE_CUBE_MAP),ee.__version=J.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function ge(A,y,B,te,J,ee){let me=r.convert(B.format,B.colorSpace),ce=r.convert(B.type),fe=M(B.internalFormat,me,ce,B.colorSpace);if(!n.get(y).__hasExternalTextures){let De=Math.max(1,y.width>>ee),K=Math.max(1,y.height>>ee);J===s.TEXTURE_3D||J===s.TEXTURE_2D_ARRAY?t.texImage3D(J,ee,fe,De,K,y.depth,0,me,ce,null):t.texImage2D(J,ee,fe,De,K,0,me,ce,null)}t.bindFramebuffer(s.FRAMEBUFFER,A),pe(y)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,te,J,n.get(B).__webglTexture,0,Ae(y)):(J===s.TEXTURE_2D||J>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,te,J,n.get(B).__webglTexture,ee),t.bindFramebuffer(s.FRAMEBUFFER,null)}function Ce(A,y,B){if(s.bindRenderbuffer(s.RENDERBUFFER,A),y.depthBuffer&&!y.stencilBuffer){let te=o===!0?s.DEPTH_COMPONENT24:s.DEPTH_COMPONENT16;if(B||pe(y)){let J=y.depthTexture;J&&J.isDepthTexture&&(J.type===Dn?te=s.DEPTH_COMPONENT32F:J.type===Ln&&(te=s.DEPTH_COMPONENT24));let ee=Ae(y);pe(y)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,ee,te,y.width,y.height):s.renderbufferStorageMultisample(s.RENDERBUFFER,ee,te,y.width,y.height)}else s.renderbufferStorage(s.RENDERBUFFER,te,y.width,y.height);s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.RENDERBUFFER,A)}else if(y.depthBuffer&&y.stencilBuffer){let te=Ae(y);B&&pe(y)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,te,s.DEPTH24_STENCIL8,y.width,y.height):pe(y)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,te,s.DEPTH24_STENCIL8,y.width,y.height):s.renderbufferStorage(s.RENDERBUFFER,s.DEPTH_STENCIL,y.width,y.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.RENDERBUFFER,A)}else{let te=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let J=0;J<te.length;J++){let ee=te[J],me=r.convert(ee.format,ee.colorSpace),ce=r.convert(ee.type),fe=M(ee.internalFormat,me,ce,ee.colorSpace),Ee=Ae(y);B&&pe(y)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ee,fe,y.width,y.height):pe(y)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ee,fe,y.width,y.height):s.renderbufferStorage(s.RENDERBUFFER,fe,y.width,y.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Pe(A,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(y.depthTexture).__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),V(y.depthTexture,0);let te=n.get(y.depthTexture).__webglTexture,J=Ae(y);if(y.depthTexture.format===jn)pe(y)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,te,0,J):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,te,0);else if(y.depthTexture.format===Di)pe(y)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,te,0,J):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,te,0);else throw new Error("Unknown depthTexture format")}function be(A){let y=n.get(A),B=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!y.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");Pe(y.__webglFramebuffer,A)}else if(B){y.__webglDepthbuffer=[];for(let te=0;te<6;te++)t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer[te]),y.__webglDepthbuffer[te]=s.createRenderbuffer(),Ce(y.__webglDepthbuffer[te],A,!1)}else t.bindFramebuffer(s.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer=s.createRenderbuffer(),Ce(y.__webglDepthbuffer,A,!1);t.bindFramebuffer(s.FRAMEBUFFER,null)}function Ge(A,y,B){let te=n.get(A);y!==void 0&&ge(te.__webglFramebuffer,A,A.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),B!==void 0&&be(A)}function O(A){let y=A.texture,B=n.get(A),te=n.get(y);A.addEventListener("dispose",N),A.isWebGLMultipleRenderTargets!==!0&&(te.__webglTexture===void 0&&(te.__webglTexture=s.createTexture()),te.__version=y.version,a.memory.textures++);let J=A.isWebGLCubeRenderTarget===!0,ee=A.isWebGLMultipleRenderTargets===!0,me=m(A)||o;if(J){B.__webglFramebuffer=[];for(let ce=0;ce<6;ce++)if(o&&y.mipmaps&&y.mipmaps.length>0){B.__webglFramebuffer[ce]=[];for(let fe=0;fe<y.mipmaps.length;fe++)B.__webglFramebuffer[ce][fe]=s.createFramebuffer()}else B.__webglFramebuffer[ce]=s.createFramebuffer()}else{if(o&&y.mipmaps&&y.mipmaps.length>0){B.__webglFramebuffer=[];for(let ce=0;ce<y.mipmaps.length;ce++)B.__webglFramebuffer[ce]=s.createFramebuffer()}else B.__webglFramebuffer=s.createFramebuffer();if(ee)if(i.drawBuffers){let ce=A.texture;for(let fe=0,Ee=ce.length;fe<Ee;fe++){let De=n.get(ce[fe]);De.__webglTexture===void 0&&(De.__webglTexture=s.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&A.samples>0&&pe(A)===!1){let ce=ee?y:[y];B.__webglMultisampledFramebuffer=s.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let fe=0;fe<ce.length;fe++){let Ee=ce[fe];B.__webglColorRenderbuffer[fe]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,B.__webglColorRenderbuffer[fe]);let De=r.convert(Ee.format,Ee.colorSpace),K=r.convert(Ee.type),Ve=M(Ee.internalFormat,De,K,Ee.colorSpace,A.isXRRenderTarget===!0),C=Ae(A);s.renderbufferStorageMultisample(s.RENDERBUFFER,C,Ve,A.width,A.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+fe,s.RENDERBUFFER,B.__webglColorRenderbuffer[fe])}s.bindRenderbuffer(s.RENDERBUFFER,null),A.depthBuffer&&(B.__webglDepthRenderbuffer=s.createRenderbuffer(),Ce(B.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(J){t.bindTexture(s.TEXTURE_CUBE_MAP,te.__webglTexture),G(s.TEXTURE_CUBE_MAP,y,me);for(let ce=0;ce<6;ce++)if(o&&y.mipmaps&&y.mipmaps.length>0)for(let fe=0;fe<y.mipmaps.length;fe++)ge(B.__webglFramebuffer[ce][fe],A,y,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,fe);else ge(B.__webglFramebuffer[ce],A,y,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0);b(y,me)&&_(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ee){let ce=A.texture;for(let fe=0,Ee=ce.length;fe<Ee;fe++){let De=ce[fe],K=n.get(De);t.bindTexture(s.TEXTURE_2D,K.__webglTexture),G(s.TEXTURE_2D,De,me),ge(B.__webglFramebuffer,A,De,s.COLOR_ATTACHMENT0+fe,s.TEXTURE_2D,0),b(De,me)&&_(s.TEXTURE_2D)}t.unbindTexture()}else{let ce=s.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(o?ce=A.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(ce,te.__webglTexture),G(ce,y,me),o&&y.mipmaps&&y.mipmaps.length>0)for(let fe=0;fe<y.mipmaps.length;fe++)ge(B.__webglFramebuffer[fe],A,y,s.COLOR_ATTACHMENT0,ce,fe);else ge(B.__webglFramebuffer,A,y,s.COLOR_ATTACHMENT0,ce,0);b(y,me)&&_(ce),t.unbindTexture()}A.depthBuffer&&be(A)}function ut(A){let y=m(A)||o,B=A.isWebGLMultipleRenderTargets===!0?A.texture:[A.texture];for(let te=0,J=B.length;te<J;te++){let ee=B[te];if(b(ee,y)){let me=A.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,ce=n.get(ee).__webglTexture;t.bindTexture(me,ce),_(me),t.unbindTexture()}}}function Me(A){if(o&&A.samples>0&&pe(A)===!1){let y=A.isWebGLMultipleRenderTargets?A.texture:[A.texture],B=A.width,te=A.height,J=s.COLOR_BUFFER_BIT,ee=[],me=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ce=n.get(A),fe=A.isWebGLMultipleRenderTargets===!0;if(fe)for(let Ee=0;Ee<y.length;Ee++)t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let Ee=0;Ee<y.length;Ee++){ee.push(s.COLOR_ATTACHMENT0+Ee),A.depthBuffer&&ee.push(me);let De=ce.__ignoreDepthValues!==void 0?ce.__ignoreDepthValues:!1;if(De===!1&&(A.depthBuffer&&(J|=s.DEPTH_BUFFER_BIT),A.stencilBuffer&&(J|=s.STENCIL_BUFFER_BIT)),fe&&s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,ce.__webglColorRenderbuffer[Ee]),De===!0&&(s.invalidateFramebuffer(s.READ_FRAMEBUFFER,[me]),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[me])),fe){let K=n.get(y[Ee]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,K,0)}s.blitFramebuffer(0,0,B,te,0,0,B,te,J,s.NEAREST),c&&s.invalidateFramebuffer(s.READ_FRAMEBUFFER,ee)}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),fe)for(let Ee=0;Ee<y.length;Ee++){t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.RENDERBUFFER,ce.__webglColorRenderbuffer[Ee]);let De=n.get(y[Ee]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,ce.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.TEXTURE_2D,De,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}}function Ae(A){return Math.min(i.maxSamples,A.samples)}function pe(A){let y=n.get(A);return o&&A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Ke(A){let y=a.render.frame;h.get(A)!==y&&(h.set(A,y),A.update())}function Ie(A,y){let B=A.colorSpace,te=A.format,J=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||A.format===Ho||B!==tn&&B!==Wt&&($e.getTransfer(B)===Je?o===!1?e.has("EXT_sRGB")===!0&&te===Ot?(A.format=Ho,A.minFilter=At,A.generateMipmaps=!1):y=rr.sRGBToLinear(y):(te!==Ot||J!==Fn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),y}this.allocateTextureUnit=I,this.resetTextureUnits=j,this.setTexture2D=V,this.setTexture2DArray=Y,this.setTexture3D=q,this.setTextureCube=W,this.rebindTextures=Ge,this.setupRenderTarget=O,this.updateRenderTargetMipmap=ut,this.updateMultisampleRenderTarget=Me,this.setupDepthRenderbuffer=be,this.setupFrameBufferTexture=ge,this.useMultisampledRTT=pe}function x0(s,e,t){let n=t.isWebGL2;function i(r,a=Wt){let o,l=$e.getTransfer(a);if(r===Fn)return s.UNSIGNED_BYTE;if(r===vc)return s.UNSIGNED_SHORT_4_4_4_4;if(r===Mc)return s.UNSIGNED_SHORT_5_5_5_1;if(r===Zu)return s.BYTE;if(r===Ku)return s.SHORT;if(r===xa)return s.UNSIGNED_SHORT;if(r===yc)return s.INT;if(r===Ln)return s.UNSIGNED_INT;if(r===Dn)return s.FLOAT;if(r===ss)return n?s.HALF_FLOAT:(o=e.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(r===Ju)return s.ALPHA;if(r===Ot)return s.RGBA;if(r===ju)return s.LUMINANCE;if(r===Qu)return s.LUMINANCE_ALPHA;if(r===jn)return s.DEPTH_COMPONENT;if(r===Di)return s.DEPTH_STENCIL;if(r===Ho)return o=e.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(r===ed)return s.RED;if(r===Sc)return s.RED_INTEGER;if(r===td)return s.RG;if(r===bc)return s.RG_INTEGER;if(r===Ec)return s.RGBA_INTEGER;if(r===ji||r===lo||r===co||r===ho)if(l===Je)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(r===ji)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===lo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===co)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===ho)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(r===ji)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===lo)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===co)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===ho)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===qs||r===nl||r===il||r===sl)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(r===qs)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===nl)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===il)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===sl)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Sr)return o=e.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===rl||r===ol)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(r===rl)return l===Je?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(r===ol)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===$s||r===al||r===ll||r===cl||r===Zs||r===hl||r===Ks||r===ul||r===dl||r===fl||r===pl||r===ml||r===gl||r===xl)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(r===$s)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===al)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===ll)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===cl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Zs)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===hl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===Ks)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===ul)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===dl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===fl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===pl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ml)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===gl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===xl)return l===Je?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===Qi||r===_l||r===yl)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(r===Qi)return l===Je?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===_l)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===yl)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===nd||r===vl||r===Ml||r===Sl)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(r===Qi)return o.COMPRESSED_RED_RGTC1_EXT;if(r===vl)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===Ml)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===Sl)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Jn?n?s.UNSIGNED_INT_24_8:(o=e.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):s[r]!==void 0?s[r]:null}return{convert:i}}function y0(s,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,Pc(s)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function i(m,f,b,_,M){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(m,f):f.isMeshToonMaterial?(r(m,f),u(m,f)):f.isMeshPhongMaterial?(r(m,f),h(m,f)):f.isMeshStandardMaterial?(r(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,M)):f.isMeshMatcapMaterial?(r(m,f),g(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),x(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(a(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,b,_):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===It&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===It&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let b=e.get(f).envMap;if(b&&(m.envMap.value=b,m.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;let _=s._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*_,t(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function a(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,b,_){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*b,m.scale.value=_*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function h(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),e.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,b){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===It&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function x(m,f){let b=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function v0(s,e,t,n){let i={},r={},a=[],o=t.isWebGL2?s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(b,_){let M=_.program;n.uniformBlockBinding(b,M)}function c(b,_){let M=i[b.id];M===void 0&&(g(b),M=h(b),i[b.id]=M,b.addEventListener("dispose",m));let S=_.program;n.updateUBOMapping(b,S);let R=e.render.frame;r[b.id]!==R&&(d(b),r[b.id]=R)}function h(b){let _=u();b.__bindingPointIndex=_;let M=s.createBuffer(),S=b.__size,R=b.usage;return s.bindBuffer(s.UNIFORM_BUFFER,M),s.bufferData(s.UNIFORM_BUFFER,S,R),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,_,M),M}function u(){for(let b=0;b<o;b++)if(a.indexOf(b)===-1)return a.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){let _=i[b.id],M=b.uniforms,S=b.__cache;s.bindBuffer(s.UNIFORM_BUFFER,_);for(let R=0,E=M.length;R<E;R++){let N=Array.isArray(M[R])?M[R]:[M[R]];for(let v=0,T=N.length;v<T;v++){let F=N[v];if(p(F,R,v,S)===!0){let X=F.__offset,j=Array.isArray(F.value)?F.value:[F.value],I=0;for(let U=0;U<j.length;U++){let V=j[U],Y=x(V);typeof V=="number"||typeof V=="boolean"?(F.__data[0]=V,s.bufferSubData(s.UNIFORM_BUFFER,X+I,F.__data)):V.isMatrix3?(F.__data[0]=V.elements[0],F.__data[1]=V.elements[1],F.__data[2]=V.elements[2],F.__data[3]=0,F.__data[4]=V.elements[3],F.__data[5]=V.elements[4],F.__data[6]=V.elements[5],F.__data[7]=0,F.__data[8]=V.elements[6],F.__data[9]=V.elements[7],F.__data[10]=V.elements[8],F.__data[11]=0):(V.toArray(F.__data,I),I+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,X,F.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function p(b,_,M,S){let R=b.value,E=_+"_"+M;if(S[E]===void 0)return typeof R=="number"||typeof R=="boolean"?S[E]=R:S[E]=R.clone(),!0;{let N=S[E];if(typeof R=="number"||typeof R=="boolean"){if(N!==R)return S[E]=R,!0}else if(N.equals(R)===!1)return N.copy(R),!0}return!1}function g(b){let _=b.uniforms,M=0,S=16;for(let E=0,N=_.length;E<N;E++){let v=Array.isArray(_[E])?_[E]:[_[E]];for(let T=0,F=v.length;T<F;T++){let X=v[T],j=Array.isArray(X.value)?X.value:[X.value];for(let I=0,U=j.length;I<U;I++){let V=j[I],Y=x(V),q=M%S;q!==0&&S-q<Y.boundary&&(M+=S-q),X.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),X.__offset=M,M+=Y.storage}}}let R=M%S;return R>0&&(M+=S-R),b.__size=M,b.__cache={},this}function x(b){let _={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(_.boundary=4,_.storage=4):b.isVector2?(_.boundary=8,_.storage=8):b.isVector3||b.isColor?(_.boundary=16,_.storage=12):b.isVector4?(_.boundary=16,_.storage=16):b.isMatrix3?(_.boundary=48,_.storage=48):b.isMatrix4?(_.boundary=64,_.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),_}function m(b){let _=b.target;_.removeEventListener("dispose",m);let M=a.indexOf(_.__bindingPointIndex);a.splice(M,1),s.deleteBuffer(i[_.id]),delete i[_.id],delete r[_.id]}function f(){for(let b in i)s.deleteBuffer(i[b]);a=[],i={},r={}}return{bind:l,update:c,dispose:f}}function Xs(s,e,t){return!s||!t&&s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function S0(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function mc(s,e){return s.distance-e.distance}function ga(s,e,t,n){if(s.layers.test(e.layers)&&s.raycast(e,t),n===!0){let i=s.children;for(let r=0,a=i.length;r<a;r++)ga(i[r],e,t,!0)}}var rn,hn,pu,Za,mu,gc,gu,Mn,On,It,jt,Un,Ri,Ka,Ja,ja,xu,Zn,_u,yu,Qa,el,vu,Mu,Su,bu,No,Fo,Eu,wu,Tu,Au,Ru,Cu,Pu,Iu,Lu,Du,Uu,Nu,Ys,Fu,Ou,Bu,zu,xc,ku,Hu,Nn,Gu,Vu,Wu,Xu,Yu,qu,_c,Ii,Li,Oo,Bo,Mr,zo,Qt,ko,ot,tl,ao,At,$u,ei,Fn,Zu,Ku,xa,yc,Ln,Dn,ss,vc,Mc,Jn,Ju,Ot,ju,Qu,jn,Di,ed,Sc,td,bc,Ec,ji,lo,co,ho,qs,nl,il,sl,Sr,rl,ol,$s,al,ll,cl,Zs,hl,Ks,ul,dl,fl,pl,ml,gl,xl,Qi,_l,yl,nd,vl,Ml,Sl,Js,js,uo,bl,El,wl,wc,Qn,id,sd,rd,od,Wt,at,tn,_a,br,Qs,Je,er,tr,ai,Tl,ad,ld,cd,Tc,hd,ud,dd,fd,Al,Ac,Rl,Ho,Sn,nr,ln,yt,Cl,es,rs,Er,Te,He,fo,Pl,Il,Ll,Ss,Cd,$e,li,rr,Pd,or,Id,zt,gt,Vo,bn,ar,Wo,kt,L,go,Dl,Yt,gn,Zt,bs,ci,hi,ui,An,Rn,Wn,Yi,Es,ws,Xn,Ld,qi,_o,ti,xn,yo,Ts,Cn,vo,As,Mo,Ui,nt,di,Kt,Dd,Ud,Pn,Rs,Ut,Ul,Nl,lr,os,Nd,Fl,fi,_n,Cs,$i,Fd,Od,Ol,Bl,zl,Bd,zd,nn,Jt,yn,So,vn,pi,mi,kl,bo,Eo,wo,Ps,wi,Cc,In,Is,Xe,vt,kd,Ni,ni,rt,Ls,Bt,cr,hr,St,Hd,Vt,Ao,gi,Nt,Zi,pt,cn,Hl,Yn,Ds,Gl,xi,_i,yi,Ro,Us,Ns,Fs,Os,Vl,Wl,Xl,Bs,zs,Xt,as,Wd,Xd,Yd,En,ur,Rt,vi,Mi,Xo,dr,Yo,Co,qd,$d,Ft,qn,Hs,Oi,qo,Kd,Jd,jd,Qd,ef,tf,nf,sf,rf,of,af,lf,cf,hf,uf,df,ff,pf,mf,gf,xf,_f,yf,vf,Mf,Sf,bf,Ef,wf,Tf,Af,Rf,Cf,Pf,If,Lf,Df,Uf,Nf,Ff,Of,Bf,zf,kf,Hf,Gf,Vf,Wf,Xf,Yf,qf,$f,Zf,Kf,Jf,jf,Qf,ep,tp,np,ip,sp,rp,op,ap,lp,cp,hp,up,dp,fp,pp,mp,gp,xp,_p,yp,vp,Mp,Sp,bp,Ep,wp,Tp,Ap,Rp,Cp,Pp,Ip,Lp,Dp,Up,Np,Fp,Op,Bp,zp,kp,Hp,Gp,Vp,Wp,Xp,Yp,qp,$p,Zp,Kp,Jp,jp,Qp,em,tm,nm,im,sm,rm,om,am,lm,cm,hm,um,dm,fm,pm,mm,gm,xm,_m,ym,vm,Mm,Sm,bm,Em,wm,Tm,Am,Rm,Cm,Fe,le,an,Gs,$o,Ti,Yl,Kn,Po,ql,Io,Lo,Do,$n,Si,$l,fr,pr,Lc,Dc,Uc,Nc,Fc,jl,Ql,ec,tc,nc,Zo,Ko,Jo,Uo,Pi,Ug,Ng,Wg,Xg,qg,t0,Qo,ea,l0,ta,na,d0,f0,ia,en,_0,is,sa,ls,ra,mr,gr,xr,mt,bi,fc,Ws,pc,M0,Ki,Ji,ii,_r,yr,Bi,oa,aa,la,sn,si,ca,ha,ua,cs,ri,da,fa,b0,pa,Ma,E0,Sa,w0,T0,A0,R0,C0,P0,I0,ma,Qe,Ix,vr,oi,Tr=tt(()=>{rn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},hn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},pu=0,Za=1,mu=2,gc=1,gu=2,Mn=3,On=0,It=1,jt=2,Un=0,Ri=1,Ka=2,Ja=3,ja=4,xu=5,Zn=100,_u=101,yu=102,Qa=103,el=104,vu=200,Mu=201,Su=202,bu=203,No=204,Fo=205,Eu=206,wu=207,Tu=208,Au=209,Ru=210,Cu=211,Pu=212,Iu=213,Lu=214,Du=0,Uu=1,Nu=2,Ys=3,Fu=4,Ou=5,Bu=6,zu=7,xc=0,ku=1,Hu=2,Nn=0,Gu=1,Vu=2,Wu=3,Xu=4,Yu=5,qu=6,_c=300,Ii=301,Li=302,Oo=303,Bo=304,Mr=306,zo=1e3,Qt=1001,ko=1002,ot=1003,tl=1004,ao=1005,At=1006,$u=1007,ei=1008,Fn=1009,Zu=1010,Ku=1011,xa=1012,yc=1013,Ln=1014,Dn=1015,ss=1016,vc=1017,Mc=1018,Jn=1020,Ju=1021,Ot=1023,ju=1024,Qu=1025,jn=1026,Di=1027,ed=1028,Sc=1029,td=1030,bc=1031,Ec=1033,ji=33776,lo=33777,co=33778,ho=33779,qs=35840,nl=35841,il=35842,sl=35843,Sr=36196,rl=37492,ol=37496,$s=37808,al=37809,ll=37810,cl=37811,Zs=37812,hl=37813,Ks=37814,ul=37815,dl=37816,fl=37817,pl=37818,ml=37819,gl=37820,xl=37821,Qi=36492,_l=36494,yl=36495,nd=36283,vl=36284,Ml=36285,Sl=36286,Js=2300,js=2301,uo=2302,bl=2400,El=2401,wl=2402,wc=3e3,Qn=3001,id=3200,sd=3201,rd=0,od=1,Wt="",at="srgb",tn="srgb-linear",_a="display-p3",br="display-p3-linear",Qs="linear",Je="srgb",er="rec709",tr="p3",ai=7680,Tl=519,ad=512,ld=513,cd=514,Tc=515,hd=516,ud=517,dd=518,fd=519,Al=35044,Ac=35048,Rl="300 es",Ho=1035,Sn=2e3,nr=2001,ln=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,e);e.target=null}}},yt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Cl=1234567,es=Math.PI/180,rs=180/Math.PI;Er={DEG2RAD:es,RAD2DEG:rs,generateUUID:zi,clamp:Mt,euclideanModulo:ya,mapLinear:pd,inverseLerp:md,lerp:ts,damp:gd,pingpong:xd,smoothstep:_d,smootherstep:yd,randInt:vd,randFloat:Md,randFloatSpread:Sd,seededRandom:bd,degToRad:Ed,radToDeg:wd,isPowerOfTwo:Go,ceilPowerOfTwo:Td,floorPowerOfTwo:ir,setQuaternionFromProperEuler:Ad,normalize:wt,denormalize:Ei},Te=class s{constructor(e=0,t=0){s.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},He=class s{constructor(e,t,n,i,r,a,o,l,c){s.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c)}set(e,t,n,i,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],p=n[5],g=n[8],x=i[0],m=i[3],f=i[6],b=i[1],_=i[4],M=i[7],S=i[2],R=i[5],E=i[8];return r[0]=a*x+o*b+l*S,r[3]=a*m+o*_+l*R,r[6]=a*f+o*M+l*E,r[1]=c*x+h*b+u*S,r[4]=c*m+h*_+u*R,r[7]=c*f+h*M+u*E,r[2]=d*x+p*b+g*S,r[5]=d*m+p*_+g*R,r[8]=d*f+p*M+g*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,p=c*r-a*l,g=t*u+n*d+i*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=u*x,e[1]=(i*c-h*n)*x,e[2]=(o*n-i*a)*x,e[3]=d*x,e[4]=(h*t-i*l)*x,e[5]=(i*r-o*t)*x,e[6]=p*x,e[7]=(n*l-c*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(fo.makeScale(e,t)),this}rotate(e){return this.premultiply(fo.makeRotation(-e)),this}translate(e,t){return this.premultiply(fo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},fo=new He;Pl={};Il=new He().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Ll=new He().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ss={[tn]:{transfer:Qs,primaries:er,toReference:s=>s,fromReference:s=>s},[at]:{transfer:Je,primaries:er,toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[br]:{transfer:Qs,primaries:tr,toReference:s=>s.applyMatrix3(Ll),fromReference:s=>s.applyMatrix3(Il)},[_a]:{transfer:Je,primaries:tr,toReference:s=>s.convertSRGBToLinear().applyMatrix3(Ll),fromReference:s=>s.applyMatrix3(Il).convertLinearToSRGB()}},Cd=new Set([tn,br]),$e={enabled:!0,_workingColorSpace:tn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!Cd.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,e,t){if(this.enabled===!1||e===t||!e||!t)return s;let n=Ss[e].toReference,i=Ss[t].fromReference;return i(n(s))},fromWorkingColorSpace:function(s,e){return this.convert(s,this._workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this._workingColorSpace)},getPrimaries:function(s){return Ss[s].primaries},getTransfer:function(s){return s===Wt?Qs:Ss[s].transfer}};rr=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{li===void 0&&(li=sr("canvas")),li.width=e.width,li.height=e.height;let n=li.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=li}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=sr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=Ci(r[a]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Ci(t[n]/255)*255):t[n]=Ci(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Pd=0,or=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pd++}),this.uuid=zi(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(mo(i[a].image)):r.push(mo(i[a]))}else r=mo(i);n.url=r}return t||(e.images[this.uuid]=n),n}};Id=0,zt=class s extends ln{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=Qt,i=Qt,r=At,a=ei,o=Ot,l=Fn,c=s.DEFAULT_ANISOTROPY,h=Wt){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Id++}),this.uuid=zi(),this.name="",this.source=new or(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Te(0,0),this.repeat=new Te(1,1),this.center=new Te(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new He,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(ns("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===Qn?at:Wt),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==_c)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case zo:e.x=e.x-Math.floor(e.x);break;case Qt:e.x=e.x<0?0:1;break;case ko:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case zo:e.y=e.y-Math.floor(e.y);break;case Qt:e.y=e.y<0?0:1;break;case ko:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return ns("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===at?Qn:wc}set encoding(e){ns("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===Qn?at:Wt}};zt.DEFAULT_IMAGE=null;zt.DEFAULT_MAPPING=_c;zt.DEFAULT_ANISOTROPY=1;gt=class s{constructor(e=0,t=0,n=0,i=1){s.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],g=l[9],x=l[2],m=l[6],f=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let _=(c+1)/2,M=(p+1)/2,S=(f+1)/2,R=(h+d)/4,E=(u+x)/4,N=(g+m)/4;return _>M&&_>S?_<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(_),i=R/n,r=E/n):M>S?M<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(M),n=R/i,r=N/i):S<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(S),n=E/r,i=N/r),this.set(n,i,r,t),this}let b=Math.sqrt((m-g)*(m-g)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(u-x)/b,this.z=(d-h)/b,this.w=Math.acos((c+p+f-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Vo=class extends ln{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t);let i={width:e,height:t,depth:1};n.encoding!==void 0&&(ns("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===Qn?at:Wt),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:At,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new zt(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new or(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},bn=class extends Vo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},ar=class extends zt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=ot,this.minFilter=ot,this.wrapR=Qt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Wo=class extends zt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=ot,this.minFilter=ot,this.wrapR=Qt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},kt=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=r[a+0],p=r[a+1],g=r[a+2],x=r[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=p,e[t+2]=g,e[t+3]=x;return}if(u!==x||l!==d||c!==p||h!==g){let m=1-o,f=l*d+c*p+h*g+u*x,b=f>=0?1:-1,_=1-f*f;if(_>Number.EPSILON){let S=Math.sqrt(_),R=Math.atan2(S,f*b);m=Math.sin(m*R)/S,o=Math.sin(o*R)/S}let M=o*b;if(l=l*m+d*M,c=c*m+p*M,h=h*m+g*M,u=u*m+x*M,m===1-o){let S=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=S,c*=S,h*=S,u*=S}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,a){let o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[a],d=r[a+1],p=r[a+2],g=r[a+3];return e[t]=o*g+h*u+l*p-c*d,e[t+1]=l*g+h*d+c*u-o*p,e[t+2]=c*g+h*p+o*d-l*u,e[t+3]=h*g-o*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(r/2),d=l(n/2),p=l(i/2),g=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*p*g,this._y=c*p*u-d*h*g,this._z=c*h*g+d*p*u,this._w=c*h*u-d*p*g;break;case"YXZ":this._x=d*h*u+c*p*g,this._y=c*p*u-d*h*g,this._z=c*h*g-d*p*u,this._w=c*h*u+d*p*g;break;case"ZXY":this._x=d*h*u-c*p*g,this._y=c*p*u+d*h*g,this._z=c*h*g+d*p*u,this._w=c*h*u-d*p*g;break;case"ZYX":this._x=d*h*u-c*p*g,this._y=c*p*u+d*h*g,this._z=c*h*g-d*p*u,this._w=c*h*u+d*p*g;break;case"YZX":this._x=d*h*u+c*p*g,this._y=c*p*u+d*h*g,this._z=c*h*g-d*p*u,this._w=c*h*u-d*p*g;break;case"XZY":this._x=d*h*u-c*p*g,this._y=c*p*u-d*h*g,this._z=c*h*g+d*p*u,this._w=c*h*u+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(a-i)*p}else if(n>o&&n>u){let p=2*Math.sqrt(1+n-o-u);this._w=(h-l)/p,this._x=.25*p,this._y=(i+a)/p,this._z=(r+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-n-u);this._w=(r-c)/p,this._x=(i+a)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+u-n-o);this._w=(a-i)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Mt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+i*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*i+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class s{constructor(e=0,t=0,n=0){s.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Dl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Dl.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),h=2*(o*t-r*i),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=i+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return go.copy(this).projectOnVector(e),this.sub(go)}reflect(e){return this.sub(go.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},go=new L,Dl=new kt,Yt=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Zt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Zt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Zt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Zt):Zt.fromBufferAttribute(r,a),Zt.applyMatrix4(e.matrixWorld),this.expandByPoint(Zt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),bs.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),bs.copy(n.boundingBox)),bs.applyMatrix4(e.matrixWorld),this.union(bs)}let i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Zt),Zt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Yi),Es.subVectors(this.max,Yi),ci.subVectors(e.a,Yi),hi.subVectors(e.b,Yi),ui.subVectors(e.c,Yi),An.subVectors(hi,ci),Rn.subVectors(ui,hi),Wn.subVectors(ci,ui);let t=[0,-An.z,An.y,0,-Rn.z,Rn.y,0,-Wn.z,Wn.y,An.z,0,-An.x,Rn.z,0,-Rn.x,Wn.z,0,-Wn.x,-An.y,An.x,0,-Rn.y,Rn.x,0,-Wn.y,Wn.x,0];return!xo(t,ci,hi,ui,Es)||(t=[1,0,0,0,1,0,0,0,1],!xo(t,ci,hi,ui,Es))?!1:(ws.crossVectors(An,Rn),t=[ws.x,ws.y,ws.z],xo(t,ci,hi,ui,Es))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Zt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Zt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(gn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},gn=[new L,new L,new L,new L,new L,new L,new L,new L],Zt=new L,bs=new Yt,ci=new L,hi=new L,ui=new L,An=new L,Rn=new L,Wn=new L,Yi=new L,Es=new L,ws=new L,Xn=new L;Ld=new Yt,qi=new L,_o=new L,ti=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Ld.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;qi.subVectors(e,this.center);let t=qi.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(qi,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(_o.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(qi.copy(e.center).add(_o)),this.expandByPoint(qi.copy(e.center).sub(_o))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},xn=new L,yo=new L,Ts=new L,Cn=new L,vo=new L,As=new L,Mo=new L,Ui=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,xn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=xn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(xn.copy(this.origin).addScaledVector(this.direction,t),xn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){yo.copy(e).add(t).multiplyScalar(.5),Ts.copy(t).sub(e).normalize(),Cn.copy(this.origin).sub(yo);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Ts),o=Cn.dot(this.direction),l=-Cn.dot(Ts),c=Cn.lengthSq(),h=Math.abs(1-a*a),u,d,p,g;if(h>0)if(u=a*l-o,d=a*o-l,g=r*h,u>=0)if(d>=-g)if(d<=g){let x=1/h;u*=x,d*=x,p=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(yo).addScaledVector(Ts,d),p}intersectSphere(e,t){xn.subVectors(e.center,this.origin);let n=xn.dot(this.direction),i=xn.dot(xn)-n*n,r=e.radius*e.radius;if(i>r)return null;let a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,xn)!==null}intersectTriangle(e,t,n,i,r){vo.subVectors(t,e),As.subVectors(n,e),Mo.crossVectors(vo,As);let a=this.direction.dot(Mo),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Cn.subVectors(this.origin,e);let l=o*this.direction.dot(As.crossVectors(Cn,As));if(l<0)return null;let c=o*this.direction.dot(vo.cross(Cn));if(c<0||l+c>a)return null;let h=-o*Cn.dot(Mo);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},nt=class s{constructor(e,t,n,i,r,a,o,l,c,h,u,d,p,g,x,m){s.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c,h,u,d,p,g,x,m)}set(e,t,n,i,r,a,o,l,c,h,u,d,p,g,x,m){let f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=i,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=h,f[10]=u,f[14]=d,f[3]=p,f[7]=g,f[11]=x,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new s().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/di.setFromMatrixColumn(e,0).length(),r=1/di.setFromMatrixColumn(e,1).length(),a=1/di.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,p=a*u,g=o*h,x=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+g*c,t[5]=d-x*c,t[9]=-o*l,t[2]=x-d*c,t[6]=g+p*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,p=l*u,g=c*h,x=c*u;t[0]=d+x*o,t[4]=g*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-g,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,p=l*u,g=c*h,x=c*u;t[0]=d-x*o,t[4]=-a*u,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*h,t[9]=x-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,p=a*u,g=o*h,x=o*u;t[0]=l*h,t[4]=g*c-p,t[8]=d*c+x,t[1]=l*u,t[5]=x*c+d,t[9]=p*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,p=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=x-d*u,t[8]=g*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*u+g,t[10]=d-x*u}else if(e.order==="XZY"){let d=a*l,p=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+x,t[5]=a*h,t[9]=p*u-g,t[2]=g*u-p,t[6]=o*h,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Dd,e,Ud)}lookAt(e,t,n){let i=this.elements;return Ut.subVectors(e,t),Ut.lengthSq()===0&&(Ut.z=1),Ut.normalize(),Pn.crossVectors(n,Ut),Pn.lengthSq()===0&&(Math.abs(n.z)===1?Ut.x+=1e-4:Ut.z+=1e-4,Ut.normalize(),Pn.crossVectors(n,Ut)),Pn.normalize(),Rs.crossVectors(Ut,Pn),i[0]=Pn.x,i[4]=Rs.x,i[8]=Ut.x,i[1]=Pn.y,i[5]=Rs.y,i[9]=Ut.y,i[2]=Pn.z,i[6]=Rs.z,i[10]=Ut.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],p=n[13],g=n[2],x=n[6],m=n[10],f=n[14],b=n[3],_=n[7],M=n[11],S=n[15],R=i[0],E=i[4],N=i[8],v=i[12],T=i[1],F=i[5],X=i[9],j=i[13],I=i[2],U=i[6],V=i[10],Y=i[14],q=i[3],W=i[7],Q=i[11],ne=i[15];return r[0]=a*R+o*T+l*I+c*q,r[4]=a*E+o*F+l*U+c*W,r[8]=a*N+o*X+l*V+c*Q,r[12]=a*v+o*j+l*Y+c*ne,r[1]=h*R+u*T+d*I+p*q,r[5]=h*E+u*F+d*U+p*W,r[9]=h*N+u*X+d*V+p*Q,r[13]=h*v+u*j+d*Y+p*ne,r[2]=g*R+x*T+m*I+f*q,r[6]=g*E+x*F+m*U+f*W,r[10]=g*N+x*X+m*V+f*Q,r[14]=g*v+x*j+m*Y+f*ne,r[3]=b*R+_*T+M*I+S*q,r[7]=b*E+_*F+M*U+S*W,r[11]=b*N+_*X+M*V+S*Q,r[15]=b*v+_*j+M*Y+S*ne,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14],g=e[3],x=e[7],m=e[11],f=e[15];return g*(+r*l*u-i*c*u-r*o*d+n*c*d+i*o*p-n*l*p)+x*(+t*l*p-t*c*d+r*a*d-i*a*p+i*c*h-r*l*h)+m*(+t*c*u-t*o*p-r*a*u+n*a*p+r*o*h-n*c*h)+f*(-i*o*h-t*l*u+t*o*d+i*a*u-n*a*d+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],g=e[12],x=e[13],m=e[14],f=e[15],b=u*m*c-x*d*c+x*l*p-o*m*p-u*l*f+o*d*f,_=g*d*c-h*m*c-g*l*p+a*m*p+h*l*f-a*d*f,M=h*x*c-g*u*c+g*o*p-a*x*p-h*o*f+a*u*f,S=g*u*l-h*x*l-g*o*d+a*x*d+h*o*m-a*u*m,R=t*b+n*_+i*M+r*S;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let E=1/R;return e[0]=b*E,e[1]=(x*d*r-u*m*r-x*i*p+n*m*p+u*i*f-n*d*f)*E,e[2]=(o*m*r-x*l*r+x*i*c-n*m*c-o*i*f+n*l*f)*E,e[3]=(u*l*r-o*d*r-u*i*c+n*d*c+o*i*p-n*l*p)*E,e[4]=_*E,e[5]=(h*m*r-g*d*r+g*i*p-t*m*p-h*i*f+t*d*f)*E,e[6]=(g*l*r-a*m*r-g*i*c+t*m*c+a*i*f-t*l*f)*E,e[7]=(a*d*r-h*l*r+h*i*c-t*d*c-a*i*p+t*l*p)*E,e[8]=M*E,e[9]=(g*u*r-h*x*r-g*n*p+t*x*p+h*n*f-t*u*f)*E,e[10]=(a*x*r-g*o*r+g*n*c-t*x*c-a*n*f+t*o*f)*E,e[11]=(h*o*r-a*u*r-h*n*c+t*u*c+a*n*p-t*o*p)*E,e[12]=S*E,e[13]=(h*x*i-g*u*i+g*n*d-t*x*d-h*n*m+t*u*m)*E,e[14]=(g*o*i-a*x*i-g*n*l+t*x*l+a*n*m-t*o*m)*E,e[15]=(a*u*i-h*o*i+h*n*l-t*u*l-a*n*d+t*o*d)*E,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,p=r*h,g=r*u,x=a*h,m=a*u,f=o*u,b=l*c,_=l*h,M=l*u,S=n.x,R=n.y,E=n.z;return i[0]=(1-(x+f))*S,i[1]=(p+M)*S,i[2]=(g-_)*S,i[3]=0,i[4]=(p-M)*R,i[5]=(1-(d+f))*R,i[6]=(m+b)*R,i[7]=0,i[8]=(g+_)*E,i[9]=(m-b)*E,i[10]=(1-(d+x))*E,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,r=di.set(i[0],i[1],i[2]).length(),a=di.set(i[4],i[5],i[6]).length(),o=di.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Kt.copy(this);let c=1/r,h=1/a,u=1/o;return Kt.elements[0]*=c,Kt.elements[1]*=c,Kt.elements[2]*=c,Kt.elements[4]*=h,Kt.elements[5]*=h,Kt.elements[6]*=h,Kt.elements[8]*=u,Kt.elements[9]*=u,Kt.elements[10]*=u,t.setFromRotationMatrix(Kt),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,i,r,a,o=Sn){let l=this.elements,c=2*r/(t-e),h=2*r/(n-i),u=(t+e)/(t-e),d=(n+i)/(n-i),p,g;if(o===Sn)p=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===nr)p=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=Sn){let l=this.elements,c=1/(t-e),h=1/(n-i),u=1/(a-r),d=(t+e)*c,p=(n+i)*h,g,x;if(o===Sn)g=(a+r)*u,x=-2*u;else if(o===nr)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},di=new L,Kt=new nt,Dd=new L(0,0,0),Ud=new L(1,1,1),Pn=new L,Rs=new L,Ut=new L,Ul=new nt,Nl=new kt,lr=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],p=i[10];switch(t){case"XYZ":this._y=Math.asin(Mt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Mt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Mt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Mt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Mt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Mt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ul.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ul,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Nl.setFromEuler(this),this.setFromQuaternion(Nl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};lr.DEFAULT_ORDER="XYZ";os=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Nd=0,Fl=new L,fi=new kt,_n=new nt,Cs=new L,$i=new L,Fd=new L,Od=new kt,Ol=new L(1,0,0),Bl=new L(0,1,0),zl=new L(0,0,1),Bd={type:"added"},zd={type:"removed"},nn=class s extends ln{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Nd++}),this.uuid=zi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new L,t=new lr,n=new kt,i=new L(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new nt},normalMatrix:{value:new He}}),this.matrix=new nt,this.matrixWorld=new nt,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new os,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return fi.setFromAxisAngle(e,t),this.quaternion.multiply(fi),this}rotateOnWorldAxis(e,t){return fi.setFromAxisAngle(e,t),this.quaternion.premultiply(fi),this}rotateX(e){return this.rotateOnAxis(Ol,e)}rotateY(e){return this.rotateOnAxis(Bl,e)}rotateZ(e){return this.rotateOnAxis(zl,e)}translateOnAxis(e,t){return Fl.copy(e).applyQuaternion(this.quaternion),this.position.add(Fl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ol,e)}translateY(e){return this.translateOnAxis(Bl,e)}translateZ(e){return this.translateOnAxis(zl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(_n.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Cs.copy(e):Cs.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),$i.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?_n.lookAt($i,Cs,this.up):_n.lookAt(Cs,$i,this.up),this.quaternion.setFromRotationMatrix(_n),i&&(_n.extractRotation(i.matrixWorld),fi.setFromRotationMatrix(_n),this.quaternion.premultiply(fi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Bd)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(zd)),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),_n.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),_n.multiply(e.parent.matrixWorld)),e.applyMatrix4(_n),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($i,e,Fd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($i,Od,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++){let r=t[n];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){let i=this.children;for(let r=0,a=i.length;r<a;r++){let o=i[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxGeometryCount=this._maxGeometryCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];i.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};nn.DEFAULT_UP=new L(0,1,0);nn.DEFAULT_MATRIX_AUTO_UPDATE=!0;nn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;Jt=new L,yn=new L,So=new L,vn=new L,pi=new L,mi=new L,kl=new L,bo=new L,Eo=new L,wo=new L,Ps=!1,wi=class s{constructor(e=new L,t=new L,n=new L){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Jt.subVectors(e,t),i.cross(Jt);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Jt.subVectors(i,t),yn.subVectors(n,t),So.subVectors(e,t);let a=Jt.dot(Jt),o=Jt.dot(yn),l=Jt.dot(So),c=yn.dot(yn),h=yn.dot(So),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,p=(c*l-o*h)*d,g=(a*h-o*l)*d;return r.set(1-p-g,g,p)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,vn)===null?!1:vn.x>=0&&vn.y>=0&&vn.x+vn.y<=1}static getUV(e,t,n,i,r,a,o,l){return Ps===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ps=!0),this.getInterpolation(e,t,n,i,r,a,o,l)}static getInterpolation(e,t,n,i,r,a,o,l){return this.getBarycoord(e,t,n,i,vn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,vn.x),l.addScaledVector(a,vn.y),l.addScaledVector(o,vn.z),l)}static isFrontFacing(e,t,n,i){return Jt.subVectors(n,t),yn.subVectors(e,t),Jt.cross(yn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Jt.subVectors(this.c,this.b),yn.subVectors(this.a,this.b),Jt.cross(yn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return Ps===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ps=!0),s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,a,o;pi.subVectors(i,n),mi.subVectors(r,n),bo.subVectors(e,n);let l=pi.dot(bo),c=mi.dot(bo);if(l<=0&&c<=0)return t.copy(n);Eo.subVectors(e,i);let h=pi.dot(Eo),u=mi.dot(Eo);if(h>=0&&u<=h)return t.copy(i);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(pi,a);wo.subVectors(e,r);let p=pi.dot(wo),g=mi.dot(wo);if(g>=0&&p<=g)return t.copy(r);let x=p*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(mi,o);let m=h*g-p*u;if(m<=0&&u-h>=0&&p-g>=0)return kl.subVectors(r,i),o=(u-h)/(u-h+(p-g)),t.copy(i).addScaledVector(kl,o);let f=1/(m+x+d);return a=x*f,o=d*f,t.copy(n).addScaledVector(pi,a).addScaledVector(mi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Cc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},In={h:0,s:0,l:0},Is={h:0,s:0,l:0};Xe=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=at){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=$e.workingColorSpace){return this.r=e,this.g=t,this.b=n,$e.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=$e.workingColorSpace){if(e=ya(e,1),t=Mt(t,0,1),n=Mt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=To(a,r,e+1/3),this.g=To(a,r,e),this.b=To(a,r,e-1/3)}return $e.toWorkingColorSpace(this,i),this}setStyle(e,t=at){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=at){let n=Cc[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ci(e.r),this.g=Ci(e.g),this.b=Ci(e.b),this}copyLinearToSRGB(e){return this.r=po(e.r),this.g=po(e.g),this.b=po(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=at){return $e.fromWorkingColorSpace(vt.copy(this),e),Math.round(Mt(vt.r*255,0,255))*65536+Math.round(Mt(vt.g*255,0,255))*256+Math.round(Mt(vt.b*255,0,255))}getHexString(e=at){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.fromWorkingColorSpace(vt.copy(this),t);let n=vt.r,i=vt.g,r=vt.b,a=Math.max(n,i,r),o=Math.min(n,i,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=$e.workingColorSpace){return $e.fromWorkingColorSpace(vt.copy(this),t),e.r=vt.r,e.g=vt.g,e.b=vt.b,e}getStyle(e=at){$e.fromWorkingColorSpace(vt.copy(this),e);let t=vt.r,n=vt.g,i=vt.b;return e!==at?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(In),this.setHSL(In.h+e,In.s+t,In.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(In),e.getHSL(Is);let n=ts(In.h,Is.h,t),i=ts(In.s,Is.s,t),r=ts(In.l,Is.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},vt=new Xe;Xe.NAMES=Cc;kd=0,Ni=class extends ln{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:kd++}),this.uuid=zi(),this.name="",this.type="Material",this.blending=Ri,this.side=On,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=No,this.blendDst=Fo,this.blendEquation=Zn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Xe(0,0,0),this.blendAlpha=0,this.depthFunc=Ys,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Tl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ai,this.stencilZFail=ai,this.stencilZPass=ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ri&&(n.blending=this.blending),this.side!==On&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==No&&(n.blendSrc=this.blendSrc),this.blendDst!==Fo&&(n.blendDst=this.blendDst),this.blendEquation!==Zn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ys&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Tl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ai&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ai&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ai&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},ni=class extends Ni{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=xc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},rt=new L,Ls=new Te,Bt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Al,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Dn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ls.fromBufferAttribute(this,t),Ls.applyMatrix3(e),this.setXY(t,Ls.x,Ls.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.applyMatrix3(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.applyMatrix4(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.applyNormalMatrix(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)rt.fromBufferAttribute(this,t),rt.transformDirection(e),this.setXYZ(t,rt.x,rt.y,rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ei(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=wt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ei(t,this.array)),t}setX(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ei(t,this.array)),t}setY(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ei(t,this.array)),t}setZ(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ei(t,this.array)),t}setW(e,t){return this.normalized&&(t=wt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=wt(t,this.array),n=wt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=wt(t,this.array),n=wt(n,this.array),i=wt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=wt(t,this.array),n=wt(n,this.array),i=wt(i,this.array),r=wt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Al&&(e.usage=this.usage),e}},cr=class extends Bt{constructor(e,t,n){super(new Uint16Array(e),t,n)}},hr=class extends Bt{constructor(e,t,n){super(new Uint32Array(e),t,n)}},St=class extends Bt{constructor(e,t,n){super(new Float32Array(e),t,n)}},Hd=0,Vt=new nt,Ao=new nn,gi=new L,Nt=new Yt,Zi=new Yt,pt=new L,cn=class s extends ln{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Hd++}),this.uuid=zi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Rc(e)?hr:cr)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new He().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Vt.makeRotationFromQuaternion(e),this.applyMatrix4(Vt),this}rotateX(e){return Vt.makeRotationX(e),this.applyMatrix4(Vt),this}rotateY(e){return Vt.makeRotationY(e),this.applyMatrix4(Vt),this}rotateZ(e){return Vt.makeRotationZ(e),this.applyMatrix4(Vt),this}translate(e,t,n){return Vt.makeTranslation(e,t,n),this.applyMatrix4(Vt),this}scale(e,t,n){return Vt.makeScale(e,t,n),this.applyMatrix4(Vt),this}lookAt(e){return Ao.lookAt(e),Ao.updateMatrix(),this.applyMatrix4(Ao.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gi).negate(),this.translate(gi.x,gi.y,gi.z),this}setFromPoints(e){let t=[];for(let n=0,i=e.length;n<i;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new St(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Yt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];Nt.setFromBufferAttribute(r),this.morphTargetsRelative?(pt.addVectors(this.boundingBox.min,Nt.min),this.boundingBox.expandByPoint(pt),pt.addVectors(this.boundingBox.max,Nt.max),this.boundingBox.expandByPoint(pt)):(this.boundingBox.expandByPoint(Nt.min),this.boundingBox.expandByPoint(Nt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ti);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new L,1/0);return}if(e){let n=this.boundingSphere.center;if(Nt.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Zi.setFromBufferAttribute(o),this.morphTargetsRelative?(pt.addVectors(Nt.min,Zi.min),Nt.expandByPoint(pt),pt.addVectors(Nt.max,Zi.max),Nt.expandByPoint(pt)):(Nt.expandByPoint(Zi.min),Nt.expandByPoint(Zi.max))}Nt.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)pt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(pt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)pt.fromBufferAttribute(o,c),l&&(gi.fromBufferAttribute(e,c),pt.add(gi)),i=Math.max(i,n.distanceToSquared(pt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.array,i=t.position.array,r=t.normal.array,a=t.uv.array,o=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Bt(new Float32Array(4*o),4));let l=this.getAttribute("tangent").array,c=[],h=[];for(let T=0;T<o;T++)c[T]=new L,h[T]=new L;let u=new L,d=new L,p=new L,g=new Te,x=new Te,m=new Te,f=new L,b=new L;function _(T,F,X){u.fromArray(i,T*3),d.fromArray(i,F*3),p.fromArray(i,X*3),g.fromArray(a,T*2),x.fromArray(a,F*2),m.fromArray(a,X*2),d.sub(u),p.sub(u),x.sub(g),m.sub(g);let j=1/(x.x*m.y-m.x*x.y);isFinite(j)&&(f.copy(d).multiplyScalar(m.y).addScaledVector(p,-x.y).multiplyScalar(j),b.copy(p).multiplyScalar(x.x).addScaledVector(d,-m.x).multiplyScalar(j),c[T].add(f),c[F].add(f),c[X].add(f),h[T].add(b),h[F].add(b),h[X].add(b))}let M=this.groups;M.length===0&&(M=[{start:0,count:n.length}]);for(let T=0,F=M.length;T<F;++T){let X=M[T],j=X.start,I=X.count;for(let U=j,V=j+I;U<V;U+=3)_(n[U+0],n[U+1],n[U+2])}let S=new L,R=new L,E=new L,N=new L;function v(T){E.fromArray(r,T*3),N.copy(E);let F=c[T];S.copy(F),S.sub(E.multiplyScalar(E.dot(F))).normalize(),R.crossVectors(N,F);let j=R.dot(h[T])<0?-1:1;l[T*4]=S.x,l[T*4+1]=S.y,l[T*4+2]=S.z,l[T*4+3]=j}for(let T=0,F=M.length;T<F;++T){let X=M[T],j=X.start,I=X.count;for(let U=j,V=j+I;U<V;U+=3)v(n[U+0]),v(n[U+1]),v(n[U+2])}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Bt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);let i=new L,r=new L,a=new L,o=new L,l=new L,c=new L,h=new L,u=new L;if(e)for(let d=0,p=e.count;d<p;d+=3){let g=e.getX(d+0),x=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)pt.fromBufferAttribute(e,t),pt.normalize(),e.setXYZ(t,pt.x,pt.y,pt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),p=0,g=0;for(let x=0,m=l.length;x<m;x++){o.isInterleavedBufferAttribute?p=l[x]*o.data.stride+o.offset:p=l[x]*h;for(let f=0;f<h;f++)d[g++]=c[p++]}return new Bt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let o in i){let l=i[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=c[h],p=e(d,n);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let i={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(i[l]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let i=e.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Hl=new nt,Yn=new Ui,Ds=new ti,Gl=new L,xi=new L,_i=new L,yi=new L,Ro=new L,Us=new L,Ns=new Te,Fs=new Te,Os=new Te,Vl=new L,Wl=new L,Xl=new L,Bs=new L,zs=new L,Xt=class extends nn{constructor(e=new cn,t=new ni){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(r&&o){Us.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(Ro.fromBufferAttribute(u,e),a?Us.addScaledVector(Ro,h):Us.addScaledVector(Ro.sub(t),h))}t.add(Us)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ds.copy(n.boundingSphere),Ds.applyMatrix4(r),Yn.copy(e.ray).recast(e.near),!(Ds.containsPoint(Yn.origin)===!1&&(Yn.intersectSphere(Ds,Gl)===null||Yn.origin.distanceToSquared(Gl)>(e.far-e.near)**2))&&(Hl.copy(r).invert(),Yn.copy(e.ray).applyMatrix4(Hl),!(n.boundingBox!==null&&Yn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Yn)))}_computeIntersections(e,t,n){let i,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let m=d[g],f=a[m.materialIndex],b=Math.max(m.start,p.start),_=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let M=b,S=_;M<S;M+=3){let R=o.getX(M),E=o.getX(M+1),N=o.getX(M+2);i=ks(this,f,e,n,c,h,u,R,E,N),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{let g=Math.max(0,p.start),x=Math.min(o.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){let b=o.getX(m),_=o.getX(m+1),M=o.getX(m+2);i=ks(this,a,e,n,c,h,u,b,_,M),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){let m=d[g],f=a[m.materialIndex],b=Math.max(m.start,p.start),_=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let M=b,S=_;M<S;M+=3){let R=M,E=M+1,N=M+2;i=ks(this,f,e,n,c,h,u,R,E,N),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{let g=Math.max(0,p.start),x=Math.min(l.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){let b=m,_=m+1,M=m+2;i=ks(this,a,e,n,c,h,u,b,_,M),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}}};as=class s extends cn{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};let o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,p=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,i,a,2),g("x","z","y",1,-1,e,n,-t,i,a,3),g("x","y","z",1,-1,e,t,n,i,r,4),g("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new St(c,3)),this.setAttribute("normal",new St(h,3)),this.setAttribute("uv",new St(u,2));function g(x,m,f,b,_,M,S,R,E,N,v){let T=M/E,F=S/N,X=M/2,j=S/2,I=R/2,U=E+1,V=N+1,Y=0,q=0,W=new L;for(let Q=0;Q<V;Q++){let ne=Q*F-j;for(let ue=0;ue<U;ue++){let G=ue*T-X;W[x]=G*b,W[m]=ne*_,W[f]=I,c.push(W.x,W.y,W.z),W[x]=0,W[m]=0,W[f]=R>0?1:-1,h.push(W.x,W.y,W.z),u.push(ue/E),u.push(1-Q/N),Y+=1}}for(let Q=0;Q<N;Q++)for(let ne=0;ne<E;ne++){let ue=d+ne+U*Q,G=d+ne+U*(Q+1),Z=d+(ne+1)+U*(Q+1),he=d+(ne+1)+U*Q;l.push(ue,G,he),l.push(G,Z,he),q+=6}o.addGroup(p,q,v),p+=q,d+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};Wd={clone:Fi,merge:Tt},Xd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Yd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,En=class extends Ni{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Xd,this.fragmentShader=Yd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Fi(e.uniforms),this.uniformsGroups=Vd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},ur=class extends nn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new nt,this.projectionMatrix=new nt,this.projectionMatrixInverse=new nt,this.coordinateSystem=Sn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Rt=class extends ur{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=rs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(es*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return rs*2*Math.atan(Math.tan(es*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(es*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},vi=-90,Mi=1,Xo=class extends nn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Rt(vi,Mi,e,t);i.layers=this.layers,this.add(i);let r=new Rt(vi,Mi,e,t);r.layers=this.layers,this.add(r);let a=new Rt(vi,Mi,e,t);a.layers=this.layers,this.add(a);let o=new Rt(vi,Mi,e,t);o.layers=this.layers,this.add(o);let l=new Rt(vi,Mi,e,t);l.layers=this.layers,this.add(l);let c=new Rt(vi,Mi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===Sn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===nr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,a),e.setRenderTarget(n,2,i),e.render(t,o),e.setRenderTarget(n,3,i),e.render(t,l),e.setRenderTarget(n,4,i),e.render(t,c),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},dr=class extends zt{constructor(e,t,n,i,r,a,o,l,c,h){e=e!==void 0?e:[],t=t!==void 0?t:Ii,super(e,t,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Yo=class extends bn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];t.encoding!==void 0&&(ns("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===Qn?at:Wt),this.texture=new dr(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:At}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new as(5,5,5),r=new En({name:"CubemapFromEquirect",uniforms:Fi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:Un});r.uniforms.tEquirect.value=t;let a=new Xt(i,r),o=t.minFilter;return t.minFilter===ei&&(t.minFilter=At),new Xo(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,i){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}},Co=new L,qd=new L,$d=new He,Ft=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Co.subVectors(n,t).cross(qd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Co),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||$d.getNormalMatrix(e),i=this.coplanarPoint(Co).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},qn=new ti,Hs=new L,Oi=class{constructor(e=new Ft,t=new Ft,n=new Ft,i=new Ft,r=new Ft,a=new Ft){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Sn){let n=this.planes,i=e.elements,r=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],u=i[6],d=i[7],p=i[8],g=i[9],x=i[10],m=i[11],f=i[12],b=i[13],_=i[14],M=i[15];if(n[0].setComponents(l-r,d-c,m-p,M-f).normalize(),n[1].setComponents(l+r,d+c,m+p,M+f).normalize(),n[2].setComponents(l+a,d+h,m+g,M+b).normalize(),n[3].setComponents(l-a,d-h,m-g,M-b).normalize(),n[4].setComponents(l-o,d-u,m-x,M-_).normalize(),t===Sn)n[5].setComponents(l+o,d+u,m+x,M+_).normalize();else if(t===nr)n[5].setComponents(o,u,x,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),qn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),qn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(qn)}intersectsSprite(e){return qn.center.set(0,0,0),qn.radius=.7071067811865476,qn.applyMatrix4(e.matrixWorld),this.intersectsSphere(qn)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(Hs.x=i.normal.x>0?e.max.x:e.min.x,Hs.y=i.normal.y>0?e.max.y:e.min.y,Hs.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Hs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};qo=class s extends cn{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=e/o,d=t/l,p=[],g=[],x=[],m=[];for(let f=0;f<h;f++){let b=f*d-a;for(let _=0;_<c;_++){let M=_*u-r;g.push(M,-b,0),x.push(0,0,1),m.push(_/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let b=0;b<o;b++){let _=b+c*f,M=b+c*(f+1),S=b+1+c*(f+1),R=b+1+c*f;p.push(_,M,R),p.push(M,S,R)}this.setIndex(p),this.setAttribute("position",new St(g,3)),this.setAttribute("normal",new St(x,3)),this.setAttribute("uv",new St(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}},Kd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Jd=`#ifdef USE_ALPHAHASH
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
#endif`,jd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Qd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ef=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,tf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,nf=`#ifdef USE_AOMAP
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
#endif`,sf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,rf=`#ifdef USE_BATCHING
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
#endif`,of=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,af=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,lf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,cf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,hf=`#ifdef USE_IRIDESCENCE
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
#endif`,uf=`#ifdef USE_BUMPMAP
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
#endif`,df=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,ff=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,pf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,mf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,gf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,xf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,_f=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,yf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,vf=`#define PI 3.141592653589793
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
} // validated`,Mf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Sf=`vec3 transformedNormal = objectNormal;
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
#endif`,bf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ef=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,wf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Tf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Af="gl_FragColor = linearToOutputTexel( gl_FragColor );",Rf=`
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
}`,Cf=`#ifdef USE_ENVMAP
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
#endif`,Pf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,If=`#ifdef USE_ENVMAP
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
#endif`,Lf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Df=`#ifdef USE_ENVMAP
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
#endif`,Uf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Nf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ff=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Of=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Bf=`#ifdef USE_GRADIENTMAP
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
}`,zf=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,kf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Hf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Gf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Vf=`uniform bool receiveShadow;
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
#endif`,Wf=`#ifdef USE_ENVMAP
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
#endif`,Xf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Yf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,qf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,$f=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zf=`PhysicalMaterial material;
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
#endif`,Kf=`struct PhysicalMaterial {
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
}`,Jf=`
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
#endif`,jf=`#if defined( RE_IndirectDiffuse )
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
#endif`,Qf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,ep=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,tp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,np=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,ip=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,sp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,rp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,op=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,ap=`#if defined( USE_POINTS_UV )
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
#endif`,lp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,cp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hp=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,up=`#ifdef USE_MORPHNORMALS
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
#endif`,dp=`#ifdef USE_MORPHTARGETS
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
#endif`,fp=`#ifdef USE_MORPHTARGETS
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
#endif`,pp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,mp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,gp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,xp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_p=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,yp=`#ifdef USE_NORMALMAP
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
#endif`,vp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Mp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Sp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,bp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ep=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,wp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Tp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ap=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Rp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Cp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Pp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ip=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Lp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Dp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Up=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Np=`float getShadowMask() {
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
}`,Fp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Op=`#ifdef USE_SKINNING
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
#endif`,Bp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,zp=`#ifdef USE_SKINNING
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
#endif`,kp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Hp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Gp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Vp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Wp=`#ifdef USE_TRANSMISSION
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
#endif`,Xp=`#ifdef USE_TRANSMISSION
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
#endif`,Yp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,qp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,$p=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Zp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Kp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Jp=`uniform sampler2D t2D;
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
}`,jp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Qp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,em=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,tm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nm=`#include <common>
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
}`,im=`#if DEPTH_PACKING == 3200
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
}`,sm=`#define DISTANCE
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
}`,rm=`#define DISTANCE
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
}`,om=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,am=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lm=`uniform float scale;
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
}`,cm=`uniform vec3 diffuse;
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
}`,hm=`#include <common>
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
}`,um=`uniform vec3 diffuse;
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
}`,dm=`#define LAMBERT
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
}`,fm=`#define LAMBERT
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
}`,pm=`#define MATCAP
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
}`,mm=`#define MATCAP
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
}`,gm=`#define NORMAL
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
}`,xm=`#define NORMAL
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
}`,_m=`#define PHONG
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
}`,ym=`#define PHONG
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
}`,vm=`#define STANDARD
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
}`,Mm=`#define STANDARD
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
}`,Sm=`#define TOON
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
}`,bm=`#define TOON
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
}`,Em=`uniform float size;
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
}`,wm=`uniform vec3 diffuse;
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
}`,Tm=`#include <common>
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
}`,Am=`uniform vec3 color;
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
}`,Rm=`uniform float rotation;
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
}`,Cm=`uniform vec3 diffuse;
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
}`,Fe={alphahash_fragment:Kd,alphahash_pars_fragment:Jd,alphamap_fragment:jd,alphamap_pars_fragment:Qd,alphatest_fragment:ef,alphatest_pars_fragment:tf,aomap_fragment:nf,aomap_pars_fragment:sf,batching_pars_vertex:rf,batching_vertex:of,begin_vertex:af,beginnormal_vertex:lf,bsdfs:cf,iridescence_fragment:hf,bumpmap_pars_fragment:uf,clipping_planes_fragment:df,clipping_planes_pars_fragment:ff,clipping_planes_pars_vertex:pf,clipping_planes_vertex:mf,color_fragment:gf,color_pars_fragment:xf,color_pars_vertex:_f,color_vertex:yf,common:vf,cube_uv_reflection_fragment:Mf,defaultnormal_vertex:Sf,displacementmap_pars_vertex:bf,displacementmap_vertex:Ef,emissivemap_fragment:wf,emissivemap_pars_fragment:Tf,colorspace_fragment:Af,colorspace_pars_fragment:Rf,envmap_fragment:Cf,envmap_common_pars_fragment:Pf,envmap_pars_fragment:If,envmap_pars_vertex:Lf,envmap_physical_pars_fragment:Wf,envmap_vertex:Df,fog_vertex:Uf,fog_pars_vertex:Nf,fog_fragment:Ff,fog_pars_fragment:Of,gradientmap_pars_fragment:Bf,lightmap_fragment:zf,lightmap_pars_fragment:kf,lights_lambert_fragment:Hf,lights_lambert_pars_fragment:Gf,lights_pars_begin:Vf,lights_toon_fragment:Xf,lights_toon_pars_fragment:Yf,lights_phong_fragment:qf,lights_phong_pars_fragment:$f,lights_physical_fragment:Zf,lights_physical_pars_fragment:Kf,lights_fragment_begin:Jf,lights_fragment_maps:jf,lights_fragment_end:Qf,logdepthbuf_fragment:ep,logdepthbuf_pars_fragment:tp,logdepthbuf_pars_vertex:np,logdepthbuf_vertex:ip,map_fragment:sp,map_pars_fragment:rp,map_particle_fragment:op,map_particle_pars_fragment:ap,metalnessmap_fragment:lp,metalnessmap_pars_fragment:cp,morphcolor_vertex:hp,morphnormal_vertex:up,morphtarget_pars_vertex:dp,morphtarget_vertex:fp,normal_fragment_begin:pp,normal_fragment_maps:mp,normal_pars_fragment:gp,normal_pars_vertex:xp,normal_vertex:_p,normalmap_pars_fragment:yp,clearcoat_normal_fragment_begin:vp,clearcoat_normal_fragment_maps:Mp,clearcoat_pars_fragment:Sp,iridescence_pars_fragment:bp,opaque_fragment:Ep,packing:wp,premultiplied_alpha_fragment:Tp,project_vertex:Ap,dithering_fragment:Rp,dithering_pars_fragment:Cp,roughnessmap_fragment:Pp,roughnessmap_pars_fragment:Ip,shadowmap_pars_fragment:Lp,shadowmap_pars_vertex:Dp,shadowmap_vertex:Up,shadowmask_pars_fragment:Np,skinbase_vertex:Fp,skinning_pars_vertex:Op,skinning_vertex:Bp,skinnormal_vertex:zp,specularmap_fragment:kp,specularmap_pars_fragment:Hp,tonemapping_fragment:Gp,tonemapping_pars_fragment:Vp,transmission_fragment:Wp,transmission_pars_fragment:Xp,uv_pars_fragment:Yp,uv_pars_vertex:qp,uv_vertex:$p,worldpos_vertex:Zp,background_vert:Kp,background_frag:Jp,backgroundCube_vert:jp,backgroundCube_frag:Qp,cube_vert:em,cube_frag:tm,depth_vert:nm,depth_frag:im,distanceRGBA_vert:sm,distanceRGBA_frag:rm,equirect_vert:om,equirect_frag:am,linedashed_vert:lm,linedashed_frag:cm,meshbasic_vert:hm,meshbasic_frag:um,meshlambert_vert:dm,meshlambert_frag:fm,meshmatcap_vert:pm,meshmatcap_frag:mm,meshnormal_vert:gm,meshnormal_frag:xm,meshphong_vert:_m,meshphong_frag:ym,meshphysical_vert:vm,meshphysical_frag:Mm,meshtoon_vert:Sm,meshtoon_frag:bm,points_vert:Em,points_frag:wm,shadow_vert:Tm,shadow_frag:Am,sprite_vert:Rm,sprite_frag:Cm},le={common:{diffuse:{value:new Xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new Te(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new Xe(16777215)},opacity:{value:1},center:{value:new Te(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},an={basic:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:Fe.meshbasic_vert,fragmentShader:Fe.meshbasic_frag},lambert:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Xe(0)}}]),vertexShader:Fe.meshlambert_vert,fragmentShader:Fe.meshlambert_frag},phong:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Xe(0)},specular:{value:new Xe(1118481)},shininess:{value:30}}]),vertexShader:Fe.meshphong_vert,fragmentShader:Fe.meshphong_frag},standard:{uniforms:Tt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag},toon:{uniforms:Tt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Xe(0)}}]),vertexShader:Fe.meshtoon_vert,fragmentShader:Fe.meshtoon_frag},matcap:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:Fe.meshmatcap_vert,fragmentShader:Fe.meshmatcap_frag},points:{uniforms:Tt([le.points,le.fog]),vertexShader:Fe.points_vert,fragmentShader:Fe.points_frag},dashed:{uniforms:Tt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Fe.linedashed_vert,fragmentShader:Fe.linedashed_frag},depth:{uniforms:Tt([le.common,le.displacementmap]),vertexShader:Fe.depth_vert,fragmentShader:Fe.depth_frag},normal:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:Fe.meshnormal_vert,fragmentShader:Fe.meshnormal_frag},sprite:{uniforms:Tt([le.sprite,le.fog]),vertexShader:Fe.sprite_vert,fragmentShader:Fe.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Fe.background_vert,fragmentShader:Fe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Fe.backgroundCube_vert,fragmentShader:Fe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Fe.cube_vert,fragmentShader:Fe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Fe.equirect_vert,fragmentShader:Fe.equirect_frag},distanceRGBA:{uniforms:Tt([le.common,le.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Fe.distanceRGBA_vert,fragmentShader:Fe.distanceRGBA_frag},shadow:{uniforms:Tt([le.lights,le.fog,{color:{value:new Xe(0)},opacity:{value:1}}]),vertexShader:Fe.shadow_vert,fragmentShader:Fe.shadow_frag}};an.physical={uniforms:Tt([an.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new Te(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new Xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new Te},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new Xe(0)},specularColor:{value:new Xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new Te},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag};Gs={r:0,b:0,g:0};$o=class extends ur{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ti=4,Yl=[.125,.215,.35,.446,.526,.582],Kn=20,Po=new $o,ql=new Xe,Io=null,Lo=0,Do=0,$n=(1+Math.sqrt(5))/2,Si=1/$n,$l=[new L(1,1,1),new L(-1,1,1),new L(1,1,-1),new L(-1,1,-1),new L(0,$n,Si),new L(0,$n,-Si),new L(Si,0,$n),new L(-Si,0,$n),new L($n,Si,0),new L(-$n,Si,0)],fr=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){Io=this._renderer.getRenderTarget(),Lo=this._renderer.getActiveCubeFace(),Do=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Jl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Kl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Io,Lo,Do),e.scissorTest=!1,Vs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ii||e.mapping===Li?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Io=this._renderer.getRenderTarget(),Lo=this._renderer.getActiveCubeFace(),Do=this._renderer.getActiveMipmapLevel();let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:At,minFilter:At,generateMipmaps:!1,type:ss,format:Ot,colorSpace:tn,depthBuffer:!1},i=Zl(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Zl(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Fm(r)),this._blurMaterial=Om(r,e,t)}return i}_compileMaterial(e){let t=new Xt(this._lodPlanes[0],e);this._renderer.compile(t,Po)}_sceneToCubeUV(e,t,n,i){let o=new Rt(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(ql),h.toneMapping=Nn,h.autoClear=!1;let p=new ni({name:"PMREM.Background",side:It,depthWrite:!1,depthTest:!1}),g=new Xt(new as,p),x=!1,m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,x=!0):(p.color.copy(ql),x=!0);for(let f=0;f<6;f++){let b=f%3;b===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):b===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));let _=this._cubeSize;Vs(i,b*_,f>2?_:0,_,_),h.setRenderTarget(i),x&&h.render(g,o),h.render(e,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===Ii||e.mapping===Li;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Jl()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Kl());let r=i?this._cubemapMaterial:this._equirectMaterial,a=new Xt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Vs(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,Po)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){let r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),a=$l[(i-1)%$l.length];this._blur(e,i-1,i,r,a)}t.autoClear=n}_blur(e,t,n,i,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,i,"latitudinal",r),this._halfBlur(a,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Xt(this._lodPlanes[i],c),d=c.uniforms,p=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Kn-1),x=r/g,m=isFinite(r)?1+Math.floor(h*x):Kn;m>Kn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Kn}`);let f=[],b=0;for(let E=0;E<Kn;++E){let N=E/x,v=Math.exp(-N*N/2);f.push(v),E===0?b+=v:E<m&&(b+=2*v)}for(let E=0;E<f.length;E++)f[E]=f[E]/b;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:_}=this;d.dTheta.value=g,d.mipInt.value=_-n;let M=this._sizeLods[i],S=3*M*(i>_-Ti?i-_+Ti:0),R=4*(this._cubeSize-M);Vs(t,S,R,3*M,2*M),l.setRenderTarget(t),l.render(u,Po)}};pr=class extends zt{constructor(e,t,n,i,r,a,o,l,c,h){if(h=h!==void 0?h:jn,h!==jn&&h!==Di)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===jn&&(n=Ln),n===void 0&&h===Di&&(n=Jn),super(null,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:ot,this.minFilter=l!==void 0?l:ot,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Lc=new zt,Dc=new pr(1,1);Dc.compareFunction=Tc;Uc=new ar,Nc=new Wo,Fc=new dr,jl=[],Ql=[],ec=new Float32Array(16),tc=new Float32Array(9),nc=new Float32Array(4);Zo=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=dg(t.type)}},Ko=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Lg(t.type)}},Jo=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,a=i.length;r!==a;++r){let o=i[r];o.setValue(e,t[o.id],n)}}},Uo=/(\w+)(\])?(\[|\.)?/g;Pi=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let r=e.getActiveUniform(t,i),a=e.getUniformLocation(t,r.name);Dg(r,a,this)}}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let a=e[i];a.id in t&&n.push(a)}return n}};Ug=37297,Ng=0;Wg=/^[ \t]*#include +<([\w\d./]+)>/gm;Xg=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);qg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;t0=0,Qo=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new ea(e),t.set(e,n)),n}},ea=class{constructor(e){this.id=t0++,this.code=e,this.usedTimes=0}};l0=0;ta=class extends Ni{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=id,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},na=class extends Ni{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},d0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,f0=`uniform sampler2D shadow_pass;
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
}`;ia=class extends Rt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},en=class extends nn{constructor(){super(),this.isGroup=!0,this.type="Group"}},_0={type:"move"},is=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new en,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new en,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new en,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let x of e.hand.values()){let m=t.getJointPose(x,n),f=this._getHandJoint(c,x);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(_0)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new en;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},sa=class extends ln{constructor(e,t){super();let n=this,i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,g=null,x=t.getContextAttributes(),m=null,f=null,b=[],_=[],M=new Te,S=null,R=new Rt;R.layers.enable(1),R.viewport=new gt;let E=new Rt;E.layers.enable(2),E.viewport=new gt;let N=[R,E],v=new ia;v.layers.enable(1),v.layers.enable(2);let T=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let Z=b[G];return Z===void 0&&(Z=new is,b[G]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(G){let Z=b[G];return Z===void 0&&(Z=new is,b[G]=Z),Z.getGripSpace()},this.getHand=function(G){let Z=b[G];return Z===void 0&&(Z=new is,b[G]=Z),Z.getHandSpace()};function X(G){let Z=_.indexOf(G.inputSource);if(Z===-1)return;let he=b[Z];he!==void 0&&(he.update(G.inputSource,G.frame,c||a),he.dispatchEvent({type:G.type,data:G.inputSource}))}function j(){i.removeEventListener("select",X),i.removeEventListener("selectstart",X),i.removeEventListener("selectend",X),i.removeEventListener("squeeze",X),i.removeEventListener("squeezestart",X),i.removeEventListener("squeezeend",X),i.removeEventListener("end",j),i.removeEventListener("inputsourceschange",I);for(let G=0;G<b.length;G++){let Z=_[G];Z!==null&&(_[G]=null,b[G].disconnect(Z))}T=null,F=null,e.setRenderTarget(m),p=null,d=null,u=null,i=null,f=null,ue.stop(),n.isPresenting=!1,e.setPixelRatio(S),e.setSize(M.width,M.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){r=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){o=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(G){c=G},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(G){if(i=G,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",X),i.addEventListener("selectstart",X),i.addEventListener("selectend",X),i.addEventListener("squeeze",X),i.addEventListener("squeezestart",X),i.addEventListener("squeezeend",X),i.addEventListener("end",j),i.addEventListener("inputsourceschange",I),x.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(M),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){let Z={antialias:i.renderState.layers===void 0?x.antialias:!0,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(i,t,Z),i.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),f=new bn(p.framebufferWidth,p.framebufferHeight,{format:Ot,type:Fn,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil})}else{let Z=null,he=null,_e=null;x.depth&&(_e=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Z=x.stencil?Di:jn,he=x.stencil?Jn:Ln);let ge={colorFormat:t.RGBA8,depthFormat:_e,scaleFactor:r};u=new XRWebGLBinding(i,t),d=u.createProjectionLayer(ge),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),f=new bn(d.textureWidth,d.textureHeight,{format:Ot,type:Fn,depthTexture:new pr(d.textureWidth,d.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,Z),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0});let Ce=e.properties.get(f);Ce.__ignoreDepthValues=d.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),ue.setContext(i),ue.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode};function I(G){for(let Z=0;Z<G.removed.length;Z++){let he=G.removed[Z],_e=_.indexOf(he);_e>=0&&(_[_e]=null,b[_e].disconnect(he))}for(let Z=0;Z<G.added.length;Z++){let he=G.added[Z],_e=_.indexOf(he);if(_e===-1){for(let Ce=0;Ce<b.length;Ce++)if(Ce>=_.length){_.push(he),_e=Ce;break}else if(_[Ce]===null){_[Ce]=he,_e=Ce;break}if(_e===-1)break}let ge=b[_e];ge&&ge.connect(he)}}let U=new L,V=new L;function Y(G,Z,he){U.setFromMatrixPosition(Z.matrixWorld),V.setFromMatrixPosition(he.matrixWorld);let _e=U.distanceTo(V),ge=Z.projectionMatrix.elements,Ce=he.projectionMatrix.elements,Pe=ge[14]/(ge[10]-1),be=ge[14]/(ge[10]+1),Ge=(ge[9]+1)/ge[5],O=(ge[9]-1)/ge[5],ut=(ge[8]-1)/ge[0],Me=(Ce[8]+1)/Ce[0],Ae=Pe*ut,pe=Pe*Me,Ke=_e/(-ut+Me),Ie=Ke*-ut;Z.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(Ie),G.translateZ(Ke),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();let A=Pe+Ke,y=be+Ke,B=Ae-Ie,te=pe+(_e-Ie),J=Ge*be/y*A,ee=O*be/y*A;G.projectionMatrix.makePerspective(B,te,J,ee,A,y),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function q(G,Z){Z===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(Z.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(i===null)return;v.near=E.near=R.near=G.near,v.far=E.far=R.far=G.far,(T!==v.near||F!==v.far)&&(i.updateRenderState({depthNear:v.near,depthFar:v.far}),T=v.near,F=v.far);let Z=G.parent,he=v.cameras;q(v,Z);for(let _e=0;_e<he.length;_e++)q(he[_e],Z);he.length===2?Y(v,R,E):v.projectionMatrix.copy(R.projectionMatrix),W(G,v,Z)};function W(G,Z,he){he===null?G.matrix.copy(Z.matrixWorld):(G.matrix.copy(he.matrixWorld),G.matrix.invert(),G.matrix.multiply(Z.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(Z.projectionMatrix),G.projectionMatrixInverse.copy(Z.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=rs*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(G){l=G,d!==null&&(d.fixedFoveation=G),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=G)};let Q=null;function ne(G,Z){if(h=Z.getViewerPose(c||a),g=Z,h!==null){let he=h.views;p!==null&&(e.setRenderTargetFramebuffer(f,p.framebuffer),e.setRenderTarget(f));let _e=!1;he.length!==v.cameras.length&&(v.cameras.length=0,_e=!0);for(let ge=0;ge<he.length;ge++){let Ce=he[ge],Pe=null;if(p!==null)Pe=p.getViewport(Ce);else{let Ge=u.getViewSubImage(d,Ce);Pe=Ge.viewport,ge===0&&(e.setRenderTargetTextures(f,Ge.colorTexture,d.ignoreDepthValues?void 0:Ge.depthStencilTexture),e.setRenderTarget(f))}let be=N[ge];be===void 0&&(be=new Rt,be.layers.enable(ge),be.viewport=new gt,N[ge]=be),be.matrix.fromArray(Ce.transform.matrix),be.matrix.decompose(be.position,be.quaternion,be.scale),be.projectionMatrix.fromArray(Ce.projectionMatrix),be.projectionMatrixInverse.copy(be.projectionMatrix).invert(),be.viewport.set(Pe.x,Pe.y,Pe.width,Pe.height),ge===0&&(v.matrix.copy(be.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),_e===!0&&v.cameras.push(be)}}for(let he=0;he<b.length;he++){let _e=_[he],ge=b[he];_e!==null&&ge!==void 0&&ge.update(_e,Z,c||a)}Q&&Q(G,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),g=null}let ue=new Ic;ue.setAnimationLoop(ne),this.setAnimationLoop=function(G){Q=G},this.dispose=function(){}}};ls=class{constructor(e={}){let{canvas:t=Rd(),context:n=null,depth:i=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let d;n!==null?d=n.getContextAttributes().alpha:d=a;let p=new Uint32Array(4),g=new Int32Array(4),x=null,m=null,f=[],b=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=at,this._useLegacyLights=!1,this.toneMapping=Nn,this.toneMappingExposure=1;let _=this,M=!1,S=0,R=0,E=null,N=-1,v=null,T=new gt,F=new gt,X=null,j=new Xe(0),I=0,U=t.width,V=t.height,Y=1,q=null,W=null,Q=new gt(0,0,U,V),ne=new gt(0,0,U,V),ue=!1,G=new Oi,Z=!1,he=!1,_e=null,ge=new nt,Ce=new Te,Pe=new L,be={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Ge(){return E===null?Y:1}let O=n;function ut(w,D){for(let k=0;k<w.length;k++){let H=w[k],z=t.getContext(H,D);if(z!==null)return z}return null}try{let w={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r160"),t.addEventListener("webglcontextlost",oe,!1),t.addEventListener("webglcontextrestored",P,!1),t.addEventListener("webglcontextcreationerror",se,!1),O===null){let D=["webgl2","webgl","experimental-webgl"];if(_.isWebGL1Renderer===!0&&D.shift(),O=ut(D,w),O===null)throw ut(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&O instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),O.getShaderPrecisionFormat===void 0&&(O.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let Me,Ae,pe,Ke,Ie,A,y,B,te,J,ee,me,ce,fe,Ee,De,K,Ve,C,$,ae,ie,xe,ze;function We(){Me=new zm(O),Ae=new Dm(O,Me,e),Me.init(Ae),ie=new x0(O,Me,Ae),pe=new m0(O,Me,Ae),Ke=new Gm(O),Ie=new i0,A=new g0(O,Me,pe,Ie,Ae,ie,Ke),y=new Nm(_),B=new Bm(_),te=new Zd(O,Ae),xe=new Im(O,Me,te,Ae),J=new km(O,te,Ke,xe),ee=new Ym(O,J,te,Ke),C=new Xm(O,Ae,A),De=new Um(Ie),me=new n0(_,y,B,Me,Ae,xe,De),ce=new y0(_,Ie),fe=new r0,Ee=new u0(Me,Ae),Ve=new Pm(_,y,B,pe,ee,d,l),K=new p0(_,ee,Ae),ze=new v0(O,Ke,Ae,pe),$=new Lm(O,Me,Ke,Ae),ae=new Hm(O,Me,Ke,Ae),Ke.programs=me.programs,_.capabilities=Ae,_.extensions=Me,_.properties=Ie,_.renderLists=fe,_.shadowMap=K,_.state=pe,_.info=Ke}We();let Oe=new sa(_,O);this.xr=Oe,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let w=Me.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=Me.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(w){w!==void 0&&(Y=w,this.setSize(U,V,!1))},this.getSize=function(w){return w.set(U,V)},this.setSize=function(w,D,k=!0){if(Oe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}U=w,V=D,t.width=Math.floor(w*Y),t.height=Math.floor(D*Y),k===!0&&(t.style.width=w+"px",t.style.height=D+"px"),this.setViewport(0,0,w,D)},this.getDrawingBufferSize=function(w){return w.set(U*Y,V*Y).floor()},this.setDrawingBufferSize=function(w,D,k){U=w,V=D,Y=k,t.width=Math.floor(w*k),t.height=Math.floor(D*k),this.setViewport(0,0,w,D)},this.getCurrentViewport=function(w){return w.copy(T)},this.getViewport=function(w){return w.copy(Q)},this.setViewport=function(w,D,k,H){w.isVector4?Q.set(w.x,w.y,w.z,w.w):Q.set(w,D,k,H),pe.viewport(T.copy(Q).multiplyScalar(Y).floor())},this.getScissor=function(w){return w.copy(ne)},this.setScissor=function(w,D,k,H){w.isVector4?ne.set(w.x,w.y,w.z,w.w):ne.set(w,D,k,H),pe.scissor(F.copy(ne).multiplyScalar(Y).floor())},this.getScissorTest=function(){return ue},this.setScissorTest=function(w){pe.setScissorTest(ue=w)},this.setOpaqueSort=function(w){q=w},this.setTransparentSort=function(w){W=w},this.getClearColor=function(w){return w.copy(Ve.getClearColor())},this.setClearColor=function(){Ve.setClearColor.apply(Ve,arguments)},this.getClearAlpha=function(){return Ve.getClearAlpha()},this.setClearAlpha=function(){Ve.setClearAlpha.apply(Ve,arguments)},this.clear=function(w=!0,D=!0,k=!0){let H=0;if(w){let z=!1;if(E!==null){let de=E.texture.format;z=de===Ec||de===bc||de===Sc}if(z){let de=E.texture.type,ve=de===Fn||de===Ln||de===xa||de===Jn||de===vc||de===Mc,we=Ve.getClearColor(),Re=Ve.getClearAlpha(),Be=we.r,Le=we.g,Ue=we.b;ve?(p[0]=Be,p[1]=Le,p[2]=Ue,p[3]=Re,O.clearBufferuiv(O.COLOR,0,p)):(g[0]=Be,g[1]=Le,g[2]=Ue,g[3]=Re,O.clearBufferiv(O.COLOR,0,g))}else H|=O.COLOR_BUFFER_BIT}D&&(H|=O.DEPTH_BUFFER_BIT),k&&(H|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",oe,!1),t.removeEventListener("webglcontextrestored",P,!1),t.removeEventListener("webglcontextcreationerror",se,!1),fe.dispose(),Ee.dispose(),Ie.dispose(),y.dispose(),B.dispose(),ee.dispose(),xe.dispose(),ze.dispose(),me.dispose(),Oe.dispose(),Oe.removeEventListener("sessionstart",bt),Oe.removeEventListener("sessionend",Ze),_e&&(_e.dispose(),_e=null),Et.stop()};function oe(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function P(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;let w=Ke.autoReset,D=K.enabled,k=K.autoUpdate,H=K.needsUpdate,z=K.type;We(),Ke.autoReset=w,K.enabled=D,K.autoUpdate=k,K.needsUpdate=H,K.type=z}function se(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function re(w){let D=w.target;D.removeEventListener("dispose",re),Se(D)}function Se(w){ye(w),Ie.remove(w)}function ye(w){let D=Ie.get(w).programs;D!==void 0&&(D.forEach(function(k){me.releaseProgram(k)}),w.isShaderMaterial&&me.releaseShaderCache(w))}this.renderBufferDirect=function(w,D,k,H,z,de){D===null&&(D=be);let ve=z.isMesh&&z.matrixWorld.determinant()<0,we=su(w,D,k,H,z);pe.setMaterial(H,ve);let Re=k.index,Be=1;if(H.wireframe===!0){if(Re=J.getWireframeAttribute(k),Re===void 0)return;Be=2}let Le=k.drawRange,Ue=k.attributes.position,st=Le.start*Be,Dt=(Le.start+Le.count)*Be;de!==null&&(st=Math.max(st,de.start*Be),Dt=Math.min(Dt,(de.start+de.count)*Be)),Re!==null?(st=Math.max(st,0),Dt=Math.min(Dt,Re.count)):Ue!=null&&(st=Math.max(st,0),Dt=Math.min(Dt,Ue.count));let ft=Dt-st;if(ft<0||ft===1/0)return;xe.setup(z,H,we,k,Re);let mn,et=$;if(Re!==null&&(mn=te.get(Re),et=ae,et.setIndex(mn)),z.isMesh)H.wireframe===!0?(pe.setLineWidth(H.wireframeLinewidth*Ge()),et.setMode(O.LINES)):et.setMode(O.TRIANGLES);else if(z.isLine){let ke=H.linewidth;ke===void 0&&(ke=1),pe.setLineWidth(ke*Ge()),z.isLineSegments?et.setMode(O.LINES):z.isLineLoop?et.setMode(O.LINE_LOOP):et.setMode(O.LINE_STRIP)}else z.isPoints?et.setMode(O.POINTS):z.isSprite&&et.setMode(O.TRIANGLES);if(z.isBatchedMesh)et.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else if(z.isInstancedMesh)et.renderInstances(st,ft,z.count);else if(k.isInstancedBufferGeometry){let ke=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,no=Math.min(k.instanceCount,ke);et.renderInstances(st,ft,no)}else et.render(st,ft)};function Ye(w,D,k){w.transparent===!0&&w.side===jt&&w.forceSinglePass===!1?(w.side=It,w.needsUpdate=!0,Ms(w,D,k),w.side=On,w.needsUpdate=!0,Ms(w,D,k),w.side=jt):Ms(w,D,k)}this.compile=function(w,D,k=null){k===null&&(k=w),m=Ee.get(k),m.init(),b.push(m),k.traverseVisible(function(z){z.isLight&&z.layers.test(D.layers)&&(m.pushLight(z),z.castShadow&&m.pushShadow(z))}),w!==k&&w.traverseVisible(function(z){z.isLight&&z.layers.test(D.layers)&&(m.pushLight(z),z.castShadow&&m.pushShadow(z))}),m.setupLights(_._useLegacyLights);let H=new Set;return w.traverse(function(z){let de=z.material;if(de)if(Array.isArray(de))for(let ve=0;ve<de.length;ve++){let we=de[ve];Ye(we,k,z),H.add(we)}else Ye(de,k,z),H.add(de)}),b.pop(),m=null,H},this.compileAsync=function(w,D,k=null){let H=this.compile(w,D,k);return new Promise(z=>{function de(){if(H.forEach(function(ve){Ie.get(ve).currentProgram.isReady()&&H.delete(ve)}),H.size===0){z(w);return}setTimeout(de,10)}Me.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let qe=null;function dt(w){qe&&qe(w)}function bt(){Et.stop()}function Ze(){Et.start()}let Et=new Ic;Et.setAnimationLoop(dt),typeof self<"u"&&Et.setContext(self),this.setAnimationLoop=function(w){qe=w,Oe.setAnimationLoop(w),w===null?Et.stop():Et.start()},Oe.addEventListener("sessionstart",bt),Oe.addEventListener("sessionend",Ze),this.render=function(w,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),Oe.enabled===!0&&Oe.isPresenting===!0&&(Oe.cameraAutoUpdate===!0&&Oe.updateCamera(D),D=Oe.getCamera()),w.isScene===!0&&w.onBeforeRender(_,w,D,E),m=Ee.get(w,b.length),m.init(),b.push(m),ge.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),G.setFromProjectionMatrix(ge),he=this.localClippingEnabled,Z=De.init(this.clippingPlanes,he),x=fe.get(w,f.length),x.init(),f.push(x),on(w,D,0,_.sortObjects),x.finish(),_.sortObjects===!0&&x.sort(q,W),this.info.render.frame++,Z===!0&&De.beginShadows();let k=m.state.shadowsArray;if(K.render(k,w,D),Z===!0&&De.endShadows(),this.info.autoReset===!0&&this.info.reset(),Ve.render(x,w),m.setupLights(_._useLegacyLights),D.isArrayCamera){let H=D.cameras;for(let z=0,de=H.length;z<de;z++){let ve=H[z];Ha(x,w,ve,ve.viewport)}}else Ha(x,w,D);E!==null&&(A.updateMultisampleRenderTarget(E),A.updateRenderTargetMipmap(E)),w.isScene===!0&&w.onAfterRender(_,w,D),xe.resetDefaultState(),N=-1,v=null,b.pop(),b.length>0?m=b[b.length-1]:m=null,f.pop(),f.length>0?x=f[f.length-1]:x=null};function on(w,D,k,H){if(w.visible===!1)return;if(w.layers.test(D.layers)){if(w.isGroup)k=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(D);else if(w.isLight)m.pushLight(w),w.castShadow&&m.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||G.intersectsSprite(w)){H&&Pe.setFromMatrixPosition(w.matrixWorld).applyMatrix4(ge);let ve=ee.update(w),we=w.material;we.visible&&x.push(w,ve,we,k,Pe.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||G.intersectsObject(w))){let ve=ee.update(w),we=w.material;if(H&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Pe.copy(w.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),Pe.copy(ve.boundingSphere.center)),Pe.applyMatrix4(w.matrixWorld).applyMatrix4(ge)),Array.isArray(we)){let Re=ve.groups;for(let Be=0,Le=Re.length;Be<Le;Be++){let Ue=Re[Be],st=we[Ue.materialIndex];st&&st.visible&&x.push(w,ve,st,k,Pe.z,Ue)}}else we.visible&&x.push(w,ve,we,k,Pe.z,null)}}let de=w.children;for(let ve=0,we=de.length;ve<we;ve++)on(de[ve],D,k,H)}function Ha(w,D,k,H){let z=w.opaque,de=w.transmissive,ve=w.transparent;m.setupLightsView(k),Z===!0&&De.setGlobalState(_.clippingPlanes,k),de.length>0&&iu(z,de,D,k),H&&pe.viewport(T.copy(H)),z.length>0&&vs(z,D,k),de.length>0&&vs(de,D,k),ve.length>0&&vs(ve,D,k),pe.buffers.depth.setTest(!0),pe.buffers.depth.setMask(!0),pe.buffers.color.setMask(!0),pe.setPolygonOffset(!1)}function iu(w,D,k,H){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;let de=Ae.isWebGL2;_e===null&&(_e=new bn(1,1,{generateMipmaps:!0,type:Me.has("EXT_color_buffer_half_float")?ss:Fn,minFilter:ei,samples:de?4:0})),_.getDrawingBufferSize(Ce),de?_e.setSize(Ce.x,Ce.y):_e.setSize(ir(Ce.x),ir(Ce.y));let ve=_.getRenderTarget();_.setRenderTarget(_e),_.getClearColor(j),I=_.getClearAlpha(),I<1&&_.setClearColor(16777215,.5),_.clear();let we=_.toneMapping;_.toneMapping=Nn,vs(w,k,H),A.updateMultisampleRenderTarget(_e),A.updateRenderTargetMipmap(_e);let Re=!1;for(let Be=0,Le=D.length;Be<Le;Be++){let Ue=D[Be],st=Ue.object,Dt=Ue.geometry,ft=Ue.material,mn=Ue.group;if(ft.side===jt&&st.layers.test(H.layers)){let et=ft.side;ft.side=It,ft.needsUpdate=!0,Ga(st,k,H,Dt,ft,mn),ft.side=et,ft.needsUpdate=!0,Re=!0}}Re===!0&&(A.updateMultisampleRenderTarget(_e),A.updateRenderTargetMipmap(_e)),_.setRenderTarget(ve),_.setClearColor(j,I),_.toneMapping=we}function vs(w,D,k){let H=D.isScene===!0?D.overrideMaterial:null;for(let z=0,de=w.length;z<de;z++){let ve=w[z],we=ve.object,Re=ve.geometry,Be=H===null?ve.material:H,Le=ve.group;we.layers.test(k.layers)&&Ga(we,D,k,Re,Be,Le)}}function Ga(w,D,k,H,z,de){w.onBeforeRender(_,D,k,H,z,de),w.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),z.onBeforeRender(_,D,k,H,w,de),z.transparent===!0&&z.side===jt&&z.forceSinglePass===!1?(z.side=It,z.needsUpdate=!0,_.renderBufferDirect(k,D,H,z,w,de),z.side=On,z.needsUpdate=!0,_.renderBufferDirect(k,D,H,z,w,de),z.side=jt):_.renderBufferDirect(k,D,H,z,w,de),w.onAfterRender(_,D,k,H,z,de)}function Ms(w,D,k){D.isScene!==!0&&(D=be);let H=Ie.get(w),z=m.state.lights,de=m.state.shadowsArray,ve=z.state.version,we=me.getParameters(w,z.state,de,D,k),Re=me.getProgramCacheKey(we),Be=H.programs;H.environment=w.isMeshStandardMaterial?D.environment:null,H.fog=D.fog,H.envMap=(w.isMeshStandardMaterial?B:y).get(w.envMap||H.environment),Be===void 0&&(w.addEventListener("dispose",re),Be=new Map,H.programs=Be);let Le=Be.get(Re);if(Le!==void 0){if(H.currentProgram===Le&&H.lightsStateVersion===ve)return Wa(w,we),Le}else we.uniforms=me.getUniforms(w),w.onBuild(k,we,_),w.onBeforeCompile(we,_),Le=me.acquireProgram(we,Re),Be.set(Re,Le),H.uniforms=we.uniforms;let Ue=H.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Ue.clippingPlanes=De.uniform),Wa(w,we),H.needsLights=ou(w),H.lightsStateVersion=ve,H.needsLights&&(Ue.ambientLightColor.value=z.state.ambient,Ue.lightProbe.value=z.state.probe,Ue.directionalLights.value=z.state.directional,Ue.directionalLightShadows.value=z.state.directionalShadow,Ue.spotLights.value=z.state.spot,Ue.spotLightShadows.value=z.state.spotShadow,Ue.rectAreaLights.value=z.state.rectArea,Ue.ltc_1.value=z.state.rectAreaLTC1,Ue.ltc_2.value=z.state.rectAreaLTC2,Ue.pointLights.value=z.state.point,Ue.pointLightShadows.value=z.state.pointShadow,Ue.hemisphereLights.value=z.state.hemi,Ue.directionalShadowMap.value=z.state.directionalShadowMap,Ue.directionalShadowMatrix.value=z.state.directionalShadowMatrix,Ue.spotShadowMap.value=z.state.spotShadowMap,Ue.spotLightMatrix.value=z.state.spotLightMatrix,Ue.spotLightMap.value=z.state.spotLightMap,Ue.pointShadowMap.value=z.state.pointShadowMap,Ue.pointShadowMatrix.value=z.state.pointShadowMatrix),H.currentProgram=Le,H.uniformsList=null,Le}function Va(w){if(w.uniformsList===null){let D=w.currentProgram.getUniforms();w.uniformsList=Pi.seqWithValue(D.seq,w.uniforms)}return w.uniformsList}function Wa(w,D){let k=Ie.get(w);k.outputColorSpace=D.outputColorSpace,k.batching=D.batching,k.instancing=D.instancing,k.instancingColor=D.instancingColor,k.skinning=D.skinning,k.morphTargets=D.morphTargets,k.morphNormals=D.morphNormals,k.morphColors=D.morphColors,k.morphTargetsCount=D.morphTargetsCount,k.numClippingPlanes=D.numClippingPlanes,k.numIntersection=D.numClipIntersection,k.vertexAlphas=D.vertexAlphas,k.vertexTangents=D.vertexTangents,k.toneMapping=D.toneMapping}function su(w,D,k,H,z){D.isScene!==!0&&(D=be),A.resetTextureUnits();let de=D.fog,ve=H.isMeshStandardMaterial?D.environment:null,we=E===null?_.outputColorSpace:E.isXRRenderTarget===!0?E.texture.colorSpace:tn,Re=(H.isMeshStandardMaterial?B:y).get(H.envMap||ve),Be=H.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Le=!!k.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Ue=!!k.morphAttributes.position,st=!!k.morphAttributes.normal,Dt=!!k.morphAttributes.color,ft=Nn;H.toneMapped&&(E===null||E.isXRRenderTarget===!0)&&(ft=_.toneMapping);let mn=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,et=mn!==void 0?mn.length:0,ke=Ie.get(H),no=m.state.lights;if(Z===!0&&(he===!0||w!==v)){let Gt=w===v&&H.id===N;De.setState(H,w,Gt)}let it=!1;H.version===ke.__version?(ke.needsLights&&ke.lightsStateVersion!==no.state.version||ke.outputColorSpace!==we||z.isBatchedMesh&&ke.batching===!1||!z.isBatchedMesh&&ke.batching===!0||z.isInstancedMesh&&ke.instancing===!1||!z.isInstancedMesh&&ke.instancing===!0||z.isSkinnedMesh&&ke.skinning===!1||!z.isSkinnedMesh&&ke.skinning===!0||z.isInstancedMesh&&ke.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&ke.instancingColor===!1&&z.instanceColor!==null||ke.envMap!==Re||H.fog===!0&&ke.fog!==de||ke.numClippingPlanes!==void 0&&(ke.numClippingPlanes!==De.numPlanes||ke.numIntersection!==De.numIntersection)||ke.vertexAlphas!==Be||ke.vertexTangents!==Le||ke.morphTargets!==Ue||ke.morphNormals!==st||ke.morphColors!==Dt||ke.toneMapping!==ft||Ae.isWebGL2===!0&&ke.morphTargetsCount!==et)&&(it=!0):(it=!0,ke.__version=H.version);let Gn=ke.currentProgram;it===!0&&(Gn=Ms(H,D,z));let Xa=!1,Xi=!1,io=!1,_t=Gn.getUniforms(),Vn=ke.uniforms;if(pe.useProgram(Gn.program)&&(Xa=!0,Xi=!0,io=!0),H.id!==N&&(N=H.id,Xi=!0),Xa||v!==w){_t.setValue(O,"projectionMatrix",w.projectionMatrix),_t.setValue(O,"viewMatrix",w.matrixWorldInverse);let Gt=_t.map.cameraPosition;Gt!==void 0&&Gt.setValue(O,Pe.setFromMatrixPosition(w.matrixWorld)),Ae.logarithmicDepthBuffer&&_t.setValue(O,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&_t.setValue(O,"isOrthographic",w.isOrthographicCamera===!0),v!==w&&(v=w,Xi=!0,io=!0)}if(z.isSkinnedMesh){_t.setOptional(O,z,"bindMatrix"),_t.setOptional(O,z,"bindMatrixInverse");let Gt=z.skeleton;Gt&&(Ae.floatVertexTextures?(Gt.boneTexture===null&&Gt.computeBoneTexture(),_t.setValue(O,"boneTexture",Gt.boneTexture,A)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}z.isBatchedMesh&&(_t.setOptional(O,z,"batchingTexture"),_t.setValue(O,"batchingTexture",z._matricesTexture,A));let so=k.morphAttributes;if((so.position!==void 0||so.normal!==void 0||so.color!==void 0&&Ae.isWebGL2===!0)&&C.update(z,k,Gn),(Xi||ke.receiveShadow!==z.receiveShadow)&&(ke.receiveShadow=z.receiveShadow,_t.setValue(O,"receiveShadow",z.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(Vn.envMap.value=Re,Vn.flipEnvMap.value=Re.isCubeTexture&&Re.isRenderTargetTexture===!1?-1:1),Xi&&(_t.setValue(O,"toneMappingExposure",_.toneMappingExposure),ke.needsLights&&ru(Vn,io),de&&H.fog===!0&&ce.refreshFogUniforms(Vn,de),ce.refreshMaterialUniforms(Vn,H,Y,V,_e),Pi.upload(O,Va(ke),Vn,A)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(Pi.upload(O,Va(ke),Vn,A),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&_t.setValue(O,"center",z.center),_t.setValue(O,"modelViewMatrix",z.modelViewMatrix),_t.setValue(O,"normalMatrix",z.normalMatrix),_t.setValue(O,"modelMatrix",z.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){let Gt=H.uniformsGroups;for(let ro=0,au=Gt.length;ro<au;ro++)if(Ae.isWebGL2){let Ya=Gt[ro];ze.update(Ya,Gn),ze.bind(Ya,Gn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Gn}function ru(w,D){w.ambientLightColor.needsUpdate=D,w.lightProbe.needsUpdate=D,w.directionalLights.needsUpdate=D,w.directionalLightShadows.needsUpdate=D,w.pointLights.needsUpdate=D,w.pointLightShadows.needsUpdate=D,w.spotLights.needsUpdate=D,w.spotLightShadows.needsUpdate=D,w.rectAreaLights.needsUpdate=D,w.hemisphereLights.needsUpdate=D}function ou(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return E},this.setRenderTargetTextures=function(w,D,k){Ie.get(w.texture).__webglTexture=D,Ie.get(w.depthTexture).__webglTexture=k;let H=Ie.get(w);H.__hasExternalTextures=!0,H.__hasExternalTextures&&(H.__autoAllocateDepthBuffer=k===void 0,H.__autoAllocateDepthBuffer||Me.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(w,D){let k=Ie.get(w);k.__webglFramebuffer=D,k.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(w,D=0,k=0){E=w,S=D,R=k;let H=!0,z=null,de=!1,ve=!1;if(w){let Re=Ie.get(w);Re.__useDefaultFramebuffer!==void 0?(pe.bindFramebuffer(O.FRAMEBUFFER,null),H=!1):Re.__webglFramebuffer===void 0?A.setupRenderTarget(w):Re.__hasExternalTextures&&A.rebindTextures(w,Ie.get(w.texture).__webglTexture,Ie.get(w.depthTexture).__webglTexture);let Be=w.texture;(Be.isData3DTexture||Be.isDataArrayTexture||Be.isCompressedArrayTexture)&&(ve=!0);let Le=Ie.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Le[D])?z=Le[D][k]:z=Le[D],de=!0):Ae.isWebGL2&&w.samples>0&&A.useMultisampledRTT(w)===!1?z=Ie.get(w).__webglMultisampledFramebuffer:Array.isArray(Le)?z=Le[k]:z=Le,T.copy(w.viewport),F.copy(w.scissor),X=w.scissorTest}else T.copy(Q).multiplyScalar(Y).floor(),F.copy(ne).multiplyScalar(Y).floor(),X=ue;if(pe.bindFramebuffer(O.FRAMEBUFFER,z)&&Ae.drawBuffers&&H&&pe.drawBuffers(w,z),pe.viewport(T),pe.scissor(F),pe.setScissorTest(X),de){let Re=Ie.get(w.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+D,Re.__webglTexture,k)}else if(ve){let Re=Ie.get(w.texture),Be=D||0;O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,Re.__webglTexture,k||0,Be)}N=-1},this.readRenderTargetPixels=function(w,D,k,H,z,de,ve){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=Ie.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&ve!==void 0&&(we=we[ve]),we){pe.bindFramebuffer(O.FRAMEBUFFER,we);try{let Re=w.texture,Be=Re.format,Le=Re.type;if(Be!==Ot&&ie.convert(Be)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}let Ue=Le===ss&&(Me.has("EXT_color_buffer_half_float")||Ae.isWebGL2&&Me.has("EXT_color_buffer_float"));if(Le!==Fn&&ie.convert(Le)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Le===Dn&&(Ae.isWebGL2||Me.has("OES_texture_float")||Me.has("WEBGL_color_buffer_float")))&&!Ue){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=w.width-H&&k>=0&&k<=w.height-z&&O.readPixels(D,k,H,z,ie.convert(Be),ie.convert(Le),de)}finally{let Re=E!==null?Ie.get(E).__webglFramebuffer:null;pe.bindFramebuffer(O.FRAMEBUFFER,Re)}}},this.copyFramebufferToTexture=function(w,D,k=0){let H=Math.pow(2,-k),z=Math.floor(D.image.width*H),de=Math.floor(D.image.height*H);A.setTexture2D(D,0),O.copyTexSubImage2D(O.TEXTURE_2D,k,0,0,w.x,w.y,z,de),pe.unbindTexture()},this.copyTextureToTexture=function(w,D,k,H=0){let z=D.image.width,de=D.image.height,ve=ie.convert(k.format),we=ie.convert(k.type);A.setTexture2D(k,0),O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,k.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,k.unpackAlignment),D.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,H,w.x,w.y,z,de,ve,we,D.image.data):D.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,H,w.x,w.y,D.mipmaps[0].width,D.mipmaps[0].height,ve,D.mipmaps[0].data):O.texSubImage2D(O.TEXTURE_2D,H,w.x,w.y,ve,we,D.image),H===0&&k.generateMipmaps&&O.generateMipmap(O.TEXTURE_2D),pe.unbindTexture()},this.copyTextureToTexture3D=function(w,D,k,H,z=0){if(_.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}let de=w.max.x-w.min.x+1,ve=w.max.y-w.min.y+1,we=w.max.z-w.min.z+1,Re=ie.convert(H.format),Be=ie.convert(H.type),Le;if(H.isData3DTexture)A.setTexture3D(H,0),Le=O.TEXTURE_3D;else if(H.isDataArrayTexture||H.isCompressedArrayTexture)A.setTexture2DArray(H,0),Le=O.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,H.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,H.unpackAlignment);let Ue=O.getParameter(O.UNPACK_ROW_LENGTH),st=O.getParameter(O.UNPACK_IMAGE_HEIGHT),Dt=O.getParameter(O.UNPACK_SKIP_PIXELS),ft=O.getParameter(O.UNPACK_SKIP_ROWS),mn=O.getParameter(O.UNPACK_SKIP_IMAGES),et=k.isCompressedTexture?k.mipmaps[z]:k.image;O.pixelStorei(O.UNPACK_ROW_LENGTH,et.width),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,et.height),O.pixelStorei(O.UNPACK_SKIP_PIXELS,w.min.x),O.pixelStorei(O.UNPACK_SKIP_ROWS,w.min.y),O.pixelStorei(O.UNPACK_SKIP_IMAGES,w.min.z),k.isDataTexture||k.isData3DTexture?O.texSubImage3D(Le,z,D.x,D.y,D.z,de,ve,we,Re,Be,et.data):k.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),O.compressedTexSubImage3D(Le,z,D.x,D.y,D.z,de,ve,we,Re,et.data)):O.texSubImage3D(Le,z,D.x,D.y,D.z,de,ve,we,Re,Be,et),O.pixelStorei(O.UNPACK_ROW_LENGTH,Ue),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,st),O.pixelStorei(O.UNPACK_SKIP_PIXELS,Dt),O.pixelStorei(O.UNPACK_SKIP_ROWS,ft),O.pixelStorei(O.UNPACK_SKIP_IMAGES,mn),z===0&&H.generateMipmaps&&O.generateMipmap(Le),pe.unbindTexture()},this.initTexture=function(w){w.isCubeTexture?A.setTextureCube(w,0):w.isData3DTexture?A.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?A.setTexture2DArray(w,0):A.setTexture2D(w,0),pe.unbindTexture()},this.resetState=function(){S=0,R=0,E=null,pe.reset(),xe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Sn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===_a?"display-p3":"srgb",t.unpackColorSpace=$e.workingColorSpace===br?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===at?Qn:wc}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===Qn?at:tn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: Three.js r155 lighting migration guide."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: Three.js r155 lighting migration guide."),this._useLegacyLights=e}},ra=class extends ls{};ra.prototype.isWebGL1Renderer=!0;mr=class s{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Xe(e),this.near=t,this.far=n}clone(){return new s(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},gr=class extends nn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}},xr=class extends zt{constructor(e=null,t=1,n=1,i,r,a,o,l,c=ot,h=ot,u,d){super(null,a,o,l,c,h,i,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},mt=class extends Bt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},bi=new nt,fc=new nt,Ws=[],pc=new Yt,M0=new nt,Ki=new Xt,Ji=new ti,ii=class extends Xt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new mt(new Float32Array(n*16),16),this.instanceColor=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,M0)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Yt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,bi),pc.copy(e.boundingBox).applyMatrix4(bi),this.boundingBox.union(pc)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ti),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,bi),Ji.copy(e.boundingSphere).applyMatrix4(bi),this.boundingSphere.union(Ji)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Ki.geometry=this.geometry,Ki.material=this.material,Ki.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ji.copy(this.boundingSphere),Ji.applyMatrix4(n),e.ray.intersectsSphere(Ji)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,bi),fc.multiplyMatrices(n,bi),Ki.matrixWorld=fc,Ki.raycast(e,Ws);for(let a=0,o=Ws.length;a<o;a++){let l=Ws[a];l.instanceId=r,l.object=this,t.push(l)}Ws.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new mt(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}},_r=class extends zt{constructor(e,t,n,i,r,a,o,l,c,h,u,d){super(null,a,o,l,c,h,i,r,u,d),this.isCompressedTexture=!0,this.image={width:t,height:n},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}},yr=class s extends cn{constructor(e=1,t=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new L,h=new Te;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let p=n+u/t*i;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new St(a,3)),this.setAttribute("normal",new St(o,3)),this.setAttribute("uv",new St(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.segments,e.thetaStart,e.thetaLength)}};Bi=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},oa=class extends Bi{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:bl,endingEnd:bl}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,a=e+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case El:r=e,o=2*t-n;break;case wl:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case El:a=e,l=2*n-t;break;case wl:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,g=(n-t)/(i-t),x=g*g,m=x*g,f=-d*m+2*d*x-d*g,b=(1+d)*m+(-1.5-2*d)*x+(-.5+d)*g+1,_=(-1-p)*m+(1.5+p)*x+.5*g,M=p*m-p*x;for(let S=0;S!==o;++S)r[S]=f*a[h+S]+b*a[c+S]+_*a[l+S]+M*a[u+S];return r}},aa=class extends Bi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},la=class extends Bi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},sn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Xs(t,this.TimeBufferType),this.values=Xs(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Xs(e.times,Array),values:Xs(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new la(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new aa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new oa(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Js:t=this.InterpolantFactoryMethodDiscrete;break;case js:t=this.InterpolantFactoryMethodLinear;break;case uo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Js;case this.InterpolantFactoryMethodLinear:return js;case this.InterpolantFactoryMethodSmooth:return uo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&S0(i))for(let o=0,l=i.length;o!==l;++o){let c=i[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===uo,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(i)l=!0;else{let u=o*n,d=u-n,p=u+n;for(let g=0;g!==n;++g){let x=t[u+g];if(x!==t[d+g]||x!==t[p+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let p=0;p!==n;++p)t[d+p]=t[u+p]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};sn.prototype.TimeBufferType=Float32Array;sn.prototype.ValueBufferType=Float32Array;sn.prototype.DefaultInterpolation=js;si=class extends sn{};si.prototype.ValueTypeName="bool";si.prototype.ValueBufferType=Array;si.prototype.DefaultInterpolation=Js;si.prototype.InterpolantFactoryMethodLinear=void 0;si.prototype.InterpolantFactoryMethodSmooth=void 0;ca=class extends sn{};ca.prototype.ValueTypeName="color";ha=class extends sn{};ha.prototype.ValueTypeName="number";ua=class extends Bi{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t),c=e*o;for(let h=c+o;c!==h;c+=4)kt.slerpFlat(r,0,a,c-o,a,c,l);return r}},cs=class extends sn{InterpolantFactoryMethodLinear(e){return new ua(this.times,this.values,this.getValueSize(),e)}};cs.prototype.ValueTypeName="quaternion";cs.prototype.DefaultInterpolation=js;cs.prototype.InterpolantFactoryMethodSmooth=void 0;ri=class extends sn{};ri.prototype.ValueTypeName="string";ri.prototype.ValueBufferType=Array;ri.prototype.DefaultInterpolation=Js;ri.prototype.InterpolantFactoryMethodLinear=void 0;ri.prototype.InterpolantFactoryMethodSmooth=void 0;da=class extends sn{};da.prototype.ValueTypeName="vector";fa=class{constructor(e,t,n){let i=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){o++,r===!1&&i.onStart!==void 0&&i.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,i.onProgress!==void 0&&i.onProgress(h,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let p=c[u],g=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return g}return null}}},b0=new fa,pa=class{constructor(e){this.manager=e!==void 0?e:b0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};pa.DEFAULT_MATERIAL_NAME="__DEFAULT";Ma="\\[\\]\\.:\\/",E0=new RegExp("["+Ma+"]","g"),Sa="[^"+Ma+"]",w0="[^"+Ma.replace("\\.","")+"]",T0=/((?:WC+[\/:])*)/.source.replace("WC",Sa),A0=/(WCOD+)?/.source.replace("WCOD",w0),R0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Sa),C0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Sa),P0=new RegExp("^"+T0+A0+R0+C0+"$"),I0=["material","materials","bones","map"],ma=class{constructor(e,t,n){let i=n||Qe.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Qe=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(E0,"")}static parseTrackName(e){let t=P0.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);I0.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[i];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Qe.Composite=ma;Qe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Qe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Qe.prototype.GetterByBindingType=[Qe.prototype._getValue_direct,Qe.prototype._getValue_array,Qe.prototype._getValue_arrayElement,Qe.prototype._getValue_toArray];Qe.prototype.SetterByBindingTypeAndVersioning=[[Qe.prototype._setValue_direct,Qe.prototype._setValue_direct_setNeedsUpdate,Qe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_array,Qe.prototype._setValue_array_setNeedsUpdate,Qe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_arrayElement,Qe.prototype._setValue_arrayElement_setNeedsUpdate,Qe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_fromArray,Qe.prototype._setValue_fromArray_setNeedsUpdate,Qe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];Ix=new Float32Array(1),vr=class{constructor(e,t,n=0,i=1/0){this.ray=new Ui(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new os,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,n=[]){return ga(e,this,n,t),n.sort(mc),n}intersectObjects(e,t=!0,n=[]){for(let i=0,r=e.length;i<r;i++)ga(e[i],this,n,t);return n.sort(mc),n}};oi=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Mt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"160"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="160")});var Oc,ba,Bc,Ar,zc,D0,Rr,kc=tt(()=>{Tr();Oc={type:"change"},ba={type:"start"},Bc={type:"end"},Ar=new Ui,zc=new Ft,D0=Math.cos(70*Er.DEG2RAD),Rr=class extends ln{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new L,this.cursor=new L,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:rn.ROTATE,MIDDLE:rn.DOLLY,RIGHT:rn.PAN},this.touches={ONE:hn.ROTATE,TWO:hn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(C){C.addEventListener("keydown",ee),this._domElementKeyEvents=C},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",ee),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(Oc),n.update(),r=i.NONE},this.update=(function(){let C=new L,$=new kt().setFromUnitVectors(e.up,new L(0,1,0)),ae=$.clone().invert(),ie=new L,xe=new kt,ze=new L,We=2*Math.PI;return function(oe=null){let P=n.object.position;C.copy(P).sub(n.target),C.applyQuaternion($),o.setFromVector3(C),n.autoRotate&&r===i.NONE&&F(v(oe)),n.enableDamping?(o.theta+=l.theta*n.dampingFactor,o.phi+=l.phi*n.dampingFactor):(o.theta+=l.theta,o.phi+=l.phi);let se=n.minAzimuthAngle,re=n.maxAzimuthAngle;isFinite(se)&&isFinite(re)&&(se<-Math.PI?se+=We:se>Math.PI&&(se-=We),re<-Math.PI?re+=We:re>Math.PI&&(re-=We),se<=re?o.theta=Math.max(se,Math.min(re,o.theta)):o.theta=o.theta>(se+re)/2?Math.max(se,o.theta):Math.min(re,o.theta)),o.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,o.phi)),o.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(h,n.dampingFactor):n.target.add(h),n.target.sub(n.cursor),n.target.clampLength(n.minTargetRadius,n.maxTargetRadius),n.target.add(n.cursor),n.zoomToCursor&&R||n.object.isOrthographicCamera?o.radius=W(o.radius):o.radius=W(o.radius*c),C.setFromSpherical(o),C.applyQuaternion(ae),P.copy(n.target).add(C),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,h.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),h.set(0,0,0));let Se=!1;if(n.zoomToCursor&&R){let ye=null;if(n.object.isPerspectiveCamera){let Ye=C.length();ye=W(Ye*c);let qe=Ye-ye;n.object.position.addScaledVector(M,qe),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let Ye=new L(S.x,S.y,0);Ye.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),Se=!0;let qe=new L(S.x,S.y,0);qe.unproject(n.object),n.object.position.sub(qe).add(Ye),n.object.updateMatrixWorld(),ye=C.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;ye!==null&&(this.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(ye).add(n.object.position):(Ar.origin.copy(n.object.position),Ar.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(Ar.direction))<D0?e.lookAt(n.target):(zc.setFromNormalAndCoplanarPoint(n.object.up,n.target),Ar.intersectPlane(zc,n.target))))}else n.object.isOrthographicCamera&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),Se=!0);return c=1,R=!1,Se||ie.distanceToSquared(n.object.position)>a||8*(1-xe.dot(n.object.quaternion))>a||ze.distanceToSquared(n.target)>0?(n.dispatchEvent(Oc),ie.copy(n.object.position),xe.copy(n.object.quaternion),ze.copy(n.target),!0):!1}})(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",fe),n.domElement.removeEventListener("pointerdown",Ie),n.domElement.removeEventListener("pointercancel",y),n.domElement.removeEventListener("wheel",J),n.domElement.removeEventListener("pointermove",A),n.domElement.removeEventListener("pointerup",y),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",ee),n._domElementKeyEvents=null)};let n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},r=i.NONE,a=1e-6,o=new oi,l=new oi,c=1,h=new L,u=new Te,d=new Te,p=new Te,g=new Te,x=new Te,m=new Te,f=new Te,b=new Te,_=new Te,M=new L,S=new Te,R=!1,E=[],N={};function v(C){return C!==null?2*Math.PI/60*n.autoRotateSpeed*C:2*Math.PI/60/60*n.autoRotateSpeed}function T(C){let $=Math.abs(C)/(100*(window.devicePixelRatio|0));return Math.pow(.95,n.zoomSpeed*$)}function F(C){l.theta-=C}function X(C){l.phi-=C}let j=(function(){let C=new L;return function(ae,ie){C.setFromMatrixColumn(ie,0),C.multiplyScalar(-ae),h.add(C)}})(),I=(function(){let C=new L;return function(ae,ie){n.screenSpacePanning===!0?C.setFromMatrixColumn(ie,1):(C.setFromMatrixColumn(ie,0),C.crossVectors(n.object.up,C)),C.multiplyScalar(ae),h.add(C)}})(),U=(function(){let C=new L;return function(ae,ie){let xe=n.domElement;if(n.object.isPerspectiveCamera){let ze=n.object.position;C.copy(ze).sub(n.target);let We=C.length();We*=Math.tan(n.object.fov/2*Math.PI/180),j(2*ae*We/xe.clientHeight,n.object.matrix),I(2*ie*We/xe.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(j(ae*(n.object.right-n.object.left)/n.object.zoom/xe.clientWidth,n.object.matrix),I(ie*(n.object.top-n.object.bottom)/n.object.zoom/xe.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}})();function V(C){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c/=C:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function Y(C){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c*=C:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function q(C,$){if(!n.zoomToCursor)return;R=!0;let ae=n.domElement.getBoundingClientRect(),ie=C-ae.left,xe=$-ae.top,ze=ae.width,We=ae.height;S.x=ie/ze*2-1,S.y=-(xe/We)*2+1,M.set(S.x,S.y,1).unproject(n.object).sub(n.object.position).normalize()}function W(C){return Math.max(n.minDistance,Math.min(n.maxDistance,C))}function Q(C){u.set(C.clientX,C.clientY)}function ne(C){q(C.clientX,C.clientX),f.set(C.clientX,C.clientY)}function ue(C){g.set(C.clientX,C.clientY)}function G(C){d.set(C.clientX,C.clientY),p.subVectors(d,u).multiplyScalar(n.rotateSpeed);let $=n.domElement;F(2*Math.PI*p.x/$.clientHeight),X(2*Math.PI*p.y/$.clientHeight),u.copy(d),n.update()}function Z(C){b.set(C.clientX,C.clientY),_.subVectors(b,f),_.y>0?V(T(_.y)):_.y<0&&Y(T(_.y)),f.copy(b),n.update()}function he(C){x.set(C.clientX,C.clientY),m.subVectors(x,g).multiplyScalar(n.panSpeed),U(m.x,m.y),g.copy(x),n.update()}function _e(C){q(C.clientX,C.clientY),C.deltaY<0?Y(T(C.deltaY)):C.deltaY>0&&V(T(C.deltaY)),n.update()}function ge(C){let $=!1;switch(C.code){case n.keys.UP:C.ctrlKey||C.metaKey||C.shiftKey?X(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(0,n.keyPanSpeed),$=!0;break;case n.keys.BOTTOM:C.ctrlKey||C.metaKey||C.shiftKey?X(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(0,-n.keyPanSpeed),$=!0;break;case n.keys.LEFT:C.ctrlKey||C.metaKey||C.shiftKey?F(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(n.keyPanSpeed,0),$=!0;break;case n.keys.RIGHT:C.ctrlKey||C.metaKey||C.shiftKey?F(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):U(-n.keyPanSpeed,0),$=!0;break}$&&(C.preventDefault(),n.update())}function Ce(C){if(E.length===1)u.set(C.pageX,C.pageY);else{let $=Ve(C),ae=.5*(C.pageX+$.x),ie=.5*(C.pageY+$.y);u.set(ae,ie)}}function Pe(C){if(E.length===1)g.set(C.pageX,C.pageY);else{let $=Ve(C),ae=.5*(C.pageX+$.x),ie=.5*(C.pageY+$.y);g.set(ae,ie)}}function be(C){let $=Ve(C),ae=C.pageX-$.x,ie=C.pageY-$.y,xe=Math.sqrt(ae*ae+ie*ie);f.set(0,xe)}function Ge(C){n.enableZoom&&be(C),n.enablePan&&Pe(C)}function O(C){n.enableZoom&&be(C),n.enableRotate&&Ce(C)}function ut(C){if(E.length==1)d.set(C.pageX,C.pageY);else{let ae=Ve(C),ie=.5*(C.pageX+ae.x),xe=.5*(C.pageY+ae.y);d.set(ie,xe)}p.subVectors(d,u).multiplyScalar(n.rotateSpeed);let $=n.domElement;F(2*Math.PI*p.x/$.clientHeight),X(2*Math.PI*p.y/$.clientHeight),u.copy(d)}function Me(C){if(E.length===1)x.set(C.pageX,C.pageY);else{let $=Ve(C),ae=.5*(C.pageX+$.x),ie=.5*(C.pageY+$.y);x.set(ae,ie)}m.subVectors(x,g).multiplyScalar(n.panSpeed),U(m.x,m.y),g.copy(x)}function Ae(C){let $=Ve(C),ae=C.pageX-$.x,ie=C.pageY-$.y,xe=Math.sqrt(ae*ae+ie*ie);b.set(0,xe),_.set(0,Math.pow(b.y/f.y,n.zoomSpeed)),V(_.y),f.copy(b);let ze=(C.pageX+$.x)*.5,We=(C.pageY+$.y)*.5;q(ze,We)}function pe(C){n.enableZoom&&Ae(C),n.enablePan&&Me(C)}function Ke(C){n.enableZoom&&Ae(C),n.enableRotate&&ut(C)}function Ie(C){n.enabled!==!1&&(E.length===0&&(n.domElement.setPointerCapture(C.pointerId),n.domElement.addEventListener("pointermove",A),n.domElement.addEventListener("pointerup",y)),Ee(C),C.pointerType==="touch"?me(C):B(C))}function A(C){n.enabled!==!1&&(C.pointerType==="touch"?ce(C):te(C))}function y(C){De(C),E.length===0&&(n.domElement.releasePointerCapture(C.pointerId),n.domElement.removeEventListener("pointermove",A),n.domElement.removeEventListener("pointerup",y)),n.dispatchEvent(Bc),r=i.NONE}function B(C){let $;switch(C.button){case 0:$=n.mouseButtons.LEFT;break;case 1:$=n.mouseButtons.MIDDLE;break;case 2:$=n.mouseButtons.RIGHT;break;default:$=-1}switch($){case rn.DOLLY:if(n.enableZoom===!1)return;ne(C),r=i.DOLLY;break;case rn.ROTATE:if(C.ctrlKey||C.metaKey||C.shiftKey){if(n.enablePan===!1)return;ue(C),r=i.PAN}else{if(n.enableRotate===!1)return;Q(C),r=i.ROTATE}break;case rn.PAN:if(C.ctrlKey||C.metaKey||C.shiftKey){if(n.enableRotate===!1)return;Q(C),r=i.ROTATE}else{if(n.enablePan===!1)return;ue(C),r=i.PAN}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ba)}function te(C){switch(r){case i.ROTATE:if(n.enableRotate===!1)return;G(C);break;case i.DOLLY:if(n.enableZoom===!1)return;Z(C);break;case i.PAN:if(n.enablePan===!1)return;he(C);break}}function J(C){n.enabled===!1||n.enableZoom===!1||r!==i.NONE||(C.preventDefault(),n.dispatchEvent(ba),_e(C),n.dispatchEvent(Bc))}function ee(C){n.enabled===!1||n.enablePan===!1||ge(C)}function me(C){switch(K(C),E.length){case 1:switch(n.touches.ONE){case hn.ROTATE:if(n.enableRotate===!1)return;Ce(C),r=i.TOUCH_ROTATE;break;case hn.PAN:if(n.enablePan===!1)return;Pe(C),r=i.TOUCH_PAN;break;default:r=i.NONE}break;case 2:switch(n.touches.TWO){case hn.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;Ge(C),r=i.TOUCH_DOLLY_PAN;break;case hn.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;O(C),r=i.TOUCH_DOLLY_ROTATE;break;default:r=i.NONE}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ba)}function ce(C){switch(K(C),r){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;ut(C),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;Me(C),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;pe(C),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Ke(C),n.update();break;default:r=i.NONE}}function fe(C){n.enabled!==!1&&C.preventDefault()}function Ee(C){E.push(C.pointerId)}function De(C){delete N[C.pointerId];for(let $=0;$<E.length;$++)if(E[$]==C.pointerId){E.splice($,1);return}}function K(C){let $=N[C.pointerId];$===void 0&&($=new Te,N[C.pointerId]=$),$.set(C.pageX,C.pageY)}function Ve(C){let $=C.pointerId===E[0]?E[1]:E[0];return N[$]}n.domElement.addEventListener("contextmenu",fe),n.domElement.addEventListener("pointerdown",Ie),n.domElement.addEventListener("pointercancel",y),n.domElement.addEventListener("wheel",J,{passive:!1}),this.update()}}});var Cr,Hc=tt(()=>{Tr();kc();Cr=class extends Rr{constructor(e,t){super(e,t),this.screenSpacePanning=!1,this.mouseButtons={LEFT:rn.PAN,MIDDLE:rn.DOLLY,RIGHT:rn.ROTATE},this.touches={ONE:hn.PAN,TWO:hn.DOLLY_ROTATE}}}});var Pr=$a(()=>{(function(s){"use strict";let n=Math.sqrt(7),i=Math.atan2(Math.sqrt(3)/2,5/2),r=[[0,0],[0,1],[1,0],[1,-1],[0,-1],[-1,0],[-1,1]];function a(M,S){return[2*M-S,M+3*S]}function o(M,S){let R=3*M+S,E=-M+2*S;if(R%7!==0||E%7!==0)throw new Error(`(${M},${S}) is not on the M lattice`);return[R/7,E/7]}function l(M,S,R){for(let E=0;E<R;E++){let N=a(M,S);M=N[0],S=N[1]}return[M,S]}let c=new Map;function h(M){if(c.has(M))return c.get(M);let S=new Int32Array([0,0]);for(let R=1;R<=M;R++){let E=S,N=E.length/2;S=new Int32Array(N*7*2);for(let v=0;v<7;v++){let[T,F]=l(r[v][0],r[v][1],R-1),X=v*N*2;for(let j=0;j<N;j++)S[X+j*2]=E[j*2]+T,S[X+j*2+1]=E[j*2+1]+F}c.set(R,S)}return c.set(M,S),S}function u(M,S){let R=(3*M+S)/7,E=(-M+2*S)/7,[N,v]=d(R,E);for(let T=0;T<7;T++){let F=N+r[T][0],X=v+r[T][1],[j,I]=a(F,X),U=M-j,V=S-I;for(let Y=0;Y<7;Y++)if(r[Y][0]===U&&r[Y][1]===V)return{q:j,r:I,child:Y,latQ:F,latR:X}}throw new Error(`parentOf(${M},${S}): no flower found (impossible)`)}function d(M,S){let R=M,E=S,N=-M-S,v=Math.round(R),T=Math.round(N),F=Math.round(E),X=Math.abs(v-R),j=Math.abs(T-N),I=Math.abs(F-E);return X>j&&X>I?v=-T-F:j>I?T=-v-F:F=-v-T,[v,F]}function p(M,S){return l(M,S,5)}function g(M,S){for(let R=0;R<5;R++){let E=o(M,S);M=E[0],S=E[1]}return[M,S]}function x(M,S){for(let R=0;R<5;R++){let E=u(M,S);M=E.latQ,S=E.latR}return[M,S]}function m(M,S){return[M*(Math.sqrt(3)/2)*6.4,S*6.4+M*.5*6.4]}function f(M){return 6.4*Math.pow(n,M)}function b(M){let S=Math.pow(n,M),R=M*i,E=Math.cos(R)*S,N=Math.sin(R)*S;return{a:E,b:N,c:-N,d:E}}let _=[1,7,49,343,2401,16807];s.GosperCore={UNIT_HEX_WIDTH_METERS:6.4,TILE_LEVEL:5,SQRT7:n,ROT_PER_LEVEL:i,NEIGHBORS:r,DEPTH_COUNTS:_,mulM:a,mulMInvExact:o,mulMPow:l,offsets:h,parentOf:u,latticeToCenter:p,centerToLattice:g,tileOfUnit:x,axialToWorld:m,levelSize:f,levelXZ:b}})(typeof self<"u"?self:globalThis)});function Gc(s,e){let t=window.GosperCore,n=F0,i=s/(Math.sqrt(3)/2*n),r=(e-i*.5*n)/n,a=i,o=r,l=-i-r,c=Math.round(a),h=Math.round(l),u=Math.round(o),d=Math.abs(c-a),p=Math.abs(h-l),g=Math.abs(u-o);d>p&&d>g?c=-h-u:p>g?h=-c-u:u=-c-h;let[x,m]=t.tileOfUnit(c,u);return{yq:x,yr:m}}async function us(){return xt?!0:hs||(hs=(async()=>{try{let s=await fetch("assets/skigebiete.json");if(!s.ok)throw new Error(`HTTP ${s.status}`);let t=(await s.json()).ski_areas,n=t.find(u=>u.name==="Kappl"),i=t.find(u=>u.name==="St. Anton am Arlberg");if(!n||!i)throw new Error("projection reference points are missing");let r=i.gps.lon-n.gps.lon,a=i.gps.lat-n.gps.lat,o=i.epsg_31254.x-n.epsg_31254.x,l=i.epsg_31254.y-n.epsg_31254.y,c=o/r,h=l/a;return xt={scaleX:c,scaleY:h,refX:n.epsg_31254.x,refY:n.epsg_31254.y,refLon:n.gps.lon,refLat:n.gps.lat},console.log("Coordinate System Calibrated:",xt),!0}catch(s){return hs=null,console.error("Failed to init projection",s),!1}})(),hs)}function Ir(s,e){if(!xt)return{x:0,y:0};let t=(e-xt.refLon)*xt.scaleX,n=(s-xt.refLat)*xt.scaleY;return{x:xt.refX+t,y:xt.refY+n}}function Vc(s,e){return xt?{lat:xt.refLat+(e-xt.refY)/xt.scaleY,lon:xt.refLon+(s-xt.refX)/xt.scaleX}:null}var zx,U0,N0,F0,xt,hs,Ea=tt(()=>{zx=oo(Pr()),U0=32,N0=.2,F0=U0*N0;xt=null,hs=null});var Lr,Wc=tt(()=>{Ea();Lr=class{constructor(){this.peaks=[],this.skiAreas=[],this.loaded=!1,this.loadPromise=null,this.activeIndex=0,this.currentResults=[],this.injectStyles(),this.initUI()}injectStyles(){let e=document.createElement("style");e.textContent=`
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
        `,document.body.appendChild(e),this.input=document.getElementById("hex-search-input"),this.resultsBox=document.getElementById("hex-search-results"),this.input.addEventListener("focus",()=>{this.loadData().then(()=>this.handleInput({target:this.input})).catch(()=>{})}),this.input.addEventListener("input",t=>this.handleInput(t)),this.input.addEventListener("keydown",t=>this.handleKey(t)),document.addEventListener("click",t=>{e.contains(t.target)||this.resultsBox.classList.remove("visible")})}async loadData(){if(!this.loaded){if(this.loadPromise)return this.loadPromise;this.loadPromise=(async()=>{await us();let[e,t]=await Promise.all([fetch("assets/tirol_peaks.geojson"),fetch("assets/skigebiete.json")]);if(!e.ok||!t.ok)throw new Error(`HTTP ${e.status}/${t.status}`);let n=await e.json(),i=await t.json();this.peaks=n.features.map(r=>({name:r.properties.name,ele:r.properties.ele,lat:r.geometry.coordinates[1],lon:r.geometry.coordinates[0],type:"peak"})).filter(r=>r.name),this.skiAreas=i.ski_areas.map(r=>({name:r.name,lat:r.gps.lat,lon:r.gps.lon,x:r.epsg_31254?.x,y:r.epsg_31254?.y,type:"ski"})),this.loaded=!0,console.log(`Loaded ${this.peaks.length} peaks and ${this.skiAreas.length} ski areas.`)})();try{return await this.loadPromise}catch(e){console.error("Search Data Load Error:",e),this.renderMessage("Search data unavailable.","empty")}finally{this.loadPromise=null}}}escapeHtml(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}renderMessage(e,t="empty"){this.resultsBox.innerHTML=`<div class="result-item ${t}"><span class="meta">${this.escapeHtml(e)}</span></div>`,this.resultsBox.classList.add("visible")}getWorldPosition(e){return Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:Ir(e.lat,e.lon)}getManifestTileKeys(e){return!e||!Array.isArray(e.tiles)?null:(this.manifestTileSource!==e&&(this.manifestTileSource=e,this.manifestTileKeys=new Set(e.tiles.map(t=>`${t.yq}_${t.yr}`))),this.manifestTileKeys)}getAvailability(e){let t=window.pistonViewer,n=t?.manifest;if(!n)return{available:!0,label:"",sectorKey:""};let i=this.getWorldPosition(e),r=Gc(i.x,i.y),a=`${r.yq}_${r.yr}`,o=t.manifestGrid||this.getManifestTileKeys(n);if(o?o.has(a):!1)return{available:!0,label:"",sectorKey:a};let c=n.bounds;return{available:!1,label:(c?i.x>=c.min_x&&i.x<=c.max_x&&i.y>=c.min_y&&i.y<=c.max_y:!1)?"No baked imagery":"Outside bake",sectorKey:a}}async handleInput(e){let t=e.target.value.toLowerCase().trim();if(t.length<2){this.resultsBox.classList.remove("visible"),this.currentResults=[],this.activeIndex=-1;return}if(!this.loaded){if(this.renderMessage("Loading search index...","loading"),await this.loadData(),this.input.value.toLowerCase().trim()!==t){this.handleInput({target:this.input});return}if(!this.loaded)return}let n=this.skiAreas.filter(a=>a.name.toLowerCase().includes(t)).slice(0,5).map(a=>({...a,category:"Ski Areas"})),i=this.peaks.filter(a=>a.name.toLowerCase().includes(t)).slice(0,10).map(a=>({...a,category:"Peaks"}));this.currentResults=[...n,...i].map(a=>({...a,availability:this.getAvailability(a)}));let r=this.currentResults.findIndex(a=>a.availability.available);this.activeIndex=r>=0?r:-1,this.renderResults()}renderResults(){if(this.currentResults.length===0){this.renderMessage("No matches found.","empty");return}let e="",t="";this.currentResults.forEach((n,i)=>{n.category!==t&&(e+=`<div class="result-section">${n.category}</div>`,t=n.category);let r=n.availability||this.getAvailability(n),a=i===this.activeIndex?"active":"",o=r.available?"":"unavailable",l=r.available?"":` <span class="result-status">${this.escapeHtml(r.label)}</span>`,c=n.type==="peak"?`${n.ele||"?"}m \u2022 Peak`:"Ski Resort",h=r.available?c:`${c} \u2022 ${r.sectorKey}`;e+=`
                <div class="result-item ${n.type} ${a} ${o}" data-idx="${i}">
                    <span class="name">${this.escapeHtml(n.name)}${l}</span>
                    <span class="meta">${this.escapeHtml(h)}</span>
                </div>
            `}),this.resultsBox.innerHTML=e,this.resultsBox.classList.add("visible"),this.resultsBox.querySelectorAll(".result-item[data-idx]").forEach(n=>{n.addEventListener("click",()=>{this.selectResult(parseInt(n.dataset.idx))})})}handleKey(e){this.resultsBox.classList.contains("visible")&&this.currentResults.length!==0&&(e.key==="ArrowDown"?(e.preventDefault(),this.moveActive(1),this.renderResults(),this.scrollToActive()):e.key==="ArrowUp"?(e.preventDefault(),this.moveActive(-1),this.renderResults(),this.scrollToActive()):e.key==="Enter"?(e.preventDefault(),this.activeIndex>=0&&this.selectResult(this.activeIndex)):e.key==="Escape"&&(this.resultsBox.classList.remove("visible"),this.input.blur()))}moveActive(e){if(!this.currentResults.some(i=>i.availability?.available!==!1))return;let t=this.currentResults.length,n=this.activeIndex>=0?this.activeIndex:e>0?-1:0;for(let i=0;i<t;i++)if(n=(n+e+t)%t,this.currentResults[n].availability?.available!==!1){this.activeIndex=n;return}}scrollToActive(){let e=this.resultsBox.querySelector(".result-item.active");e&&e.scrollIntoView({block:"nearest"})}selectResult(e){if(!this.currentResults[e])return;let t=this.currentResults[e],n=t.availability||this.getAvailability(t);if(!n.available){console.log(`Blocked navigation to ${t.name} - ${n.label}.`),window.pistonViewer?.log&&window.pistonViewer.log(`"${t.name}" has no baked imagery in this map.`,"info");return}let i=this.getWorldPosition(t);if(console.log(`Zooming to ${t.name}:`,i),window.pistonViewer){let r=window.pistonViewer;if(r.worldOrigin){let a=i.x-r.worldOrigin.x,o=-(i.y-r.worldOrigin.y);r.controls.target.set(a,0,o),r.camera.position.set(a,1500,o+1e3),r.notifyCameraMotion(performance.now()),r.controls.update(),r.needsRender=!0,r.needsLODUpdate=!0,r.updateLOD()}}this.resultsBox.classList.remove("visible"),this.input.value=t.name}}});var ds,Xc=tt(()=>{ds=class{constructor(){this.entries=new Map,this.textureEntries=new Map,this.totalGeometryBytes=0,this.totalTextureBytes=0,this.totalNetworkBytes=0,this._networkBin=0,this._networkTex=0}get totalVRAMBytes(){return this.totalGeometryBytes+this.totalTextureBytes}registerGeometry(e,t){this.deregisterGeometry(e);let n={geometryBytes:t.geometryBytes||0,q:t.q,r:t.r,lx:t.lx,lz:t.lz};this.entries.set(e,n),this.totalGeometryBytes+=n.geometryBytes}deregisterGeometry(e){let t=this.entries.get(e);t&&(this.totalGeometryBytes-=t.geometryBytes,this.entries.delete(e))}setTexture(e,t,n,i=null){let r=`${e}:${t}`;this.removeTexture(e,t);let a=this.entries.get(e),o=i||a||{};this.textureEntries.set(r,{key:e,tier:t,bytes:n||0,kind:o.kind||"texture",q:o.q,r:o.r,pageX:o.pageX,pageY:o.pageY,lx:o.lx,lz:o.lz,bounds:o.bounds||null}),this.totalTextureBytes+=n||0}removeTexture(e,t){let n=`${e}:${t}`,i=this.textureEntries.get(n);i&&(this.totalTextureBytes-=i.bytes,this.textureEntries.delete(n))}updateTextureLocation(e,t){if(t)for(let n of this.textureEntries.values())n.key===e&&(n.kind=t.kind||n.kind,n.q=t.q,n.r=t.r,n.pageX=t.pageX,n.pageY=t.pageY,n.lx=t.lx,n.lz=t.lz,n.bounds=t.bounds||null)}textureBytesFor(e){let t=0;for(let n of this.textureEntries.values())n.key===e&&(t+=n.bytes);return t}addNetworkPayload(e,t){t?.bin&&(this._networkBin+=t.bin,this.totalNetworkBytes+=t.bin),t?.tex&&(this._networkTex+=t.tex,this.totalNetworkBytes+=t.tex)}getSpatialBreakdown(e,t,n){let i={inFrustumBytes:0,outFrustumBytes:0,nearBytes:0,midBytes:0,farBytes:0,tileBreakdown:{inFrustum:0,outFrustum:0},texturePageBreakdown:{inFrustum:0,outFrustum:0,inFrustumAllocations:0,outFrustumAllocations:0},geometryBytes:this.totalGeometryBytes,textureBytes:this.totalTextureBytes};for(let[o,l]of this.entries){let c=n?.get(o),h=l.geometryBytes;!c?.bounds||!e||e.intersectsBox(c.bounds)?(i.inFrustumBytes+=h,i.tileBreakdown.inFrustum++):(i.outFrustumBytes+=h,i.tileBreakdown.outFrustum++);let d=(l.lx||0)-t.x,p=(l.lz||0)-t.z,g=Math.hypot(d,t.y,p);g<2e3?i.nearBytes+=h:g<5e3?i.midBytes+=h:i.farBytes+=h}let r=new Set,a=new Set;for(let o of this.textureEntries.values()){!o.bounds||!e||e.intersectsBox(o.bounds)?(i.inFrustumBytes+=o.bytes,i.texturePageBreakdown.inFrustumAllocations++,r.add(o.key)):(i.outFrustumBytes+=o.bytes,i.texturePageBreakdown.outFrustumAllocations++,a.add(o.key));let c=(o.lx||0)-t.x,h=(o.lz||0)-t.z,u=Math.hypot(c,t.y,h);u<2e3?i.nearBytes+=o.bytes:u<5e3?i.midBytes+=o.bytes:i.farBytes+=o.bytes}return i.texturePageBreakdown.inFrustum=r.size,i.texturePageBreakdown.outFrustum=a.size,i}static formatBytes(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(1)} MB`}}});var fs,Yc=tt(()=>{fs=class{constructor(e=268435456){this.budget=e,this.highEntries=new Map,this.highBytes=0,this.evictionCount=0,this.evictedBytes=0,this.redownloadCount=0,this.evictedHistory=new Set}get utilization(){return this.budget>0?this.highBytes/this.budget:1}get headroom(){return Math.max(0,this.budget-this.highBytes)}touch(e,t=performance.now()){let n=this.highEntries.get(e);n&&(n.lastUsed=t)}updatePriority(e,t){let n=this.highEntries.get(e);n&&(n.priority=Number.isFinite(t)?t:0)}admitHigh(e,t,n,i=new Set,r=0,a=()=>!0){if(t>this.budget)return!1;let o=Number.isFinite(r)?r:0,l=this.highEntries.get(e),c=l?.bytes||0,h=this.highBytes-c+t,u=Array.from(this.highEntries.entries()).filter(([p])=>p!==e&&!i.has(p)&&a(p)).sort((p,g)=>p[1].priority-g[1].priority||p[1].lastUsed-g[1].lastUsed),d=[];for(let[p,g]of u){if(h<=this.budget)break;if(g.priority>o)return!1;d.push([p,g]),h-=g.bytes}if(h>this.budget)return!1;for(let[p,g]of d){if(n(p)===!1)throw new Error(`preflighted high-texture eviction failed for ${p}`);this.removeHigh(p),this.evictionCount++,this.evictedBytes+=g.bytes,this.evictedHistory.add(p)}return l&&(this.highBytes-=l.bytes),this.highEntries.set(e,{bytes:t,lastUsed:performance.now(),priority:o}),this.highBytes+=t,this.evictedHistory.has(e)&&this.redownloadCount++,!0}removeHigh(e){let t=this.highEntries.get(e);t&&(this.highEntries.delete(e),this.highBytes-=t.bytes)}}});function wa(s,e){let t=s.length;if(t===0)return 0;let n=Math.min(t-1,Math.max(0,Math.floor(e*t)));return s[n]}function Ht(s,e=2){let t=10**e;return Math.round(s*t)/t}function Zc(){return{count:0,sum:0,max:0,over20:0,over33:0,over100:0,buckets:new Array(Kc).fill(0)}}var qc,Kc,$c,Dr,Jc=tt(()=>{qc="hexagons:perfProfiler:lastRun",Kc=Math.floor(200)+1,$c=["MOVING_2D","MOVING_3D","SINTERING","STATIC"];Dr=class{constructor(e,t={}){this.viewer=e,this.benchMode=t.benchMode??this._detectBenchMode(),this.startTime=performance.now(),this.runId=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,this.frames={total:0,rendered:0,skipped:0},this._exactActiveFrames=this.benchMode?[]:null,this._runningFrameStats=this.benchMode?null:Zc(),this._runningFrameStatsByState=this.benchMode?null:new Map,this._lastFrameTime=null,this._lastPersist=performance.now(),this.samples=[],this.milestones={},this.memory={jsHeapPeakBytes:0,jsHeapEndBytes:0,contextLostCount:0,glOutOfMemoryCount:0},this.vram={peakLedgerBytes:0,endLedgerBytes:0,budgetBytes:0,peakUtilization:0},this.cache={evictions:0,evictedBytes:0,redownloads:0},this.textures={upgrades:0,texStats:null},this.meta={scenario:null,texturePipeline:null,appVersion:null,timestamp:new Date().toISOString(),userAgent:typeof navigator<"u"&&navigator.userAgent||"unknown",duration_s:0,crashed:!1,finished:!1,runId:this.runId},this._recovered=this._checkRecovery(),this._attachContextLostListener(),this._samplerHandle=setInterval(()=>this._sample(),1e3),this._persist()}_detectBenchMode(){try{return typeof location<"u"&&typeof location.search=="string"&&new URLSearchParams(location.search).has("bench")}catch{return!1}}_checkRecovery(){try{let e=localStorage.getItem(qc);if(!e)return null;let t=JSON.parse(e);if(t&&t.meta&&t.meta.finished===!1)return t.meta.crashed=!0,console.log(`[PERF_RECOVERY] Found an unfinalized perf run from a previous session (scenario=${t.meta.scenario}, runId=${t.meta.runId}). Call pistonViewer.profiler.recoverLastRun() to retrieve it.`),t}catch(e){console.warn("[PERF_PROFILER] Failed to parse recovered run from localStorage:",e)}return null}recoverLastRun(){return this._recovered}_attachContextLostListener(){let e=this.viewer?.renderer?.domElement;e&&e.addEventListener("webglcontextlost",t=>{this.memory.contextLostCount++,this.meta.crashed=!0,console.error("[PERF_OOM] webglcontextlost fired \u2014 GPU context lost (likely OOM). Persisting immediately."),this._persist()})}_pollGlError(){try{let e=this.viewer?.renderer?.getContext?.();if(!e)return;let t,n=0;for(;(t=e.getError())!==e.NO_ERROR&&n++<10;)t===e.OUT_OF_MEMORY&&(this.memory.glOutOfMemoryCount++,console.warn("[PERF_OOM] gl.getError() reported OUT_OF_MEMORY (0x0505)"))}catch{}}frame(e,t,n){if(this.frames.total++,n?this.frames.rendered++:this.frames.skipped++,this._lastFrameTime!==null){let i=e-this._lastFrameTime;(n||t!=="STATIC")&&i>=0&&Number.isFinite(i)&&this._recordActiveFrame(i,t)}this._lastFrameTime=e,e-this._lastPersist>2e3&&(this._lastPersist=e,this._persist())}_sample(){let e=this.viewer,t=(performance.now()-this.startTime)/1e3,n={t:Ht(t,1)};if(typeof performance<"u"&&performance.memory){let i=performance.memory;n.jsHeap={used:i.usedJSHeapSize,total:i.totalJSHeapSize,limit:i.jsHeapSizeLimit},this.memory.jsHeapPeakBytes=Math.max(this.memory.jsHeapPeakBytes,i.usedJSHeapSize),this.memory.jsHeapEndBytes=i.usedJSHeapSize}if(e?.renderer?.info){let i=e.renderer.info;n.renderInfo={calls:i.render?.calls,triangles:i.render?.triangles,geometries:i.memory?.geometries,textures:i.memory?.textures,programs:i.programs?.length}}if(typeof e?.getDetailedStats=="function")try{let i=e.getDetailedStats("profiler-sample");n.vram={totalBytes:i.vram.totalBytes,highTextureBudgetBytes:i.vram.highTextureBudgetBytes,highTextureBudgetUtilization:i.vram.highTextureBudgetUtilization},n.tiles={loaded:i.tiles.loaded,loadQueue:i.tiles.loadQueue,textureQueue:i.tiles.textureQueue,textureResultQueue:i.tiles.textureResultQueue,geometryRebuildQueue:i.tiles.geometryRebuildQueue,activeWorkers:i.tiles.activeWorkers},this.vram.peakLedgerBytes=Math.max(this.vram.peakLedgerBytes,i.vram.totalBytes),this.vram.endLedgerBytes=i.vram.totalBytes,this.vram.budgetBytes=i.vram.highTextureBudgetBytes,this.vram.peakUtilization=Math.max(this.vram.peakUtilization,i.vram.highTextureBudgetUtilization)}catch{}if(e?.cacheManager&&(n.cache={evictions:e.cacheManager.evictionCount,evictedBytes:e.cacheManager.evictedBytes,redownloads:e.cacheManager.redownloadCount},this.cache.evictions=e.cacheManager.evictionCount,this.cache.evictedBytes=e.cacheManager.evictedBytes,this.cache.redownloads=e.cacheManager.redownloadCount),e&&e.texStats)try{n.texStats=JSON.parse(JSON.stringify(e.texStats)),this.textures.texStats=n.texStats,typeof e.texStats.upgrades=="number"&&(this.textures.upgrades=e.texStats.upgrades)}catch{}this._pollGlError(),n.glOutOfMemoryCount=this.memory.glOutOfMemoryCount,this._recordSample(n),this._persist()}_recordActiveFrame(e,t){if(this.benchMode){this._exactActiveFrames.push({dt:e,state:t});return}this._recordFrameStat(this._runningFrameStats,e),this._runningFrameStatsByState.has(t)||this._runningFrameStatsByState.set(t,Zc()),this._recordFrameStat(this._runningFrameStatsByState.get(t),e)}_recordFrameStat(e,t){e.count++,e.sum+=t,e.max=Math.max(e.max,t),t>20&&e.over20++,t>33&&e.over33++,t>100&&e.over100++;let n=Math.min(Kc-1,Math.max(0,Math.floor(t/.5)));e.buckets[n]++}_recordSample(e){if(this.benchMode){this.samples.push(e);return}if(this.samples.length<660){this.samples.push(e);return}this.samples.splice(60,1),this.samples.push(e)}_computeFrameStats(e){let t=e.map(a=>a.dt).sort((a,o)=>a-o),n=t.length,i=t.reduce((a,o)=>a+o,0),r=n?i/n:0;return{count:n,fps_avg:n&&r>0?Ht(1e3/r,1):0,p50_ms:Ht(wa(t,.5)),p95_ms:Ht(wa(t,.95)),p99_ms:Ht(wa(t,.99)),worst_ms:Ht(n?t[n-1]:0),over20:t.filter(a=>a>20).length,over33:t.filter(a=>a>33).length,over100:t.filter(a=>a>100).length}}_computeRunningFrameStats(e){let t=e?.count||0,n=t?e.sum/t:0;return{count:t,fps_avg:t&&n>0?Ht(1e3/n,1):0,p50_ms:Ht(this._histogramPercentile(e,.5)),p95_ms:Ht(this._histogramPercentile(e,.95)),p99_ms:Ht(this._histogramPercentile(e,.99)),worst_ms:Ht(t?e.max:0),over20:e?.over20||0,over33:e?.over33||0,over100:e?.over100||0}}_histogramPercentile(e,t){let n=e?.count||0;if(!n)return 0;let i=Math.min(n-1,Math.max(0,Math.floor(t*n))),r=0;for(let a=0;a<e.buckets.length;a++)if(r+=e.buckets[a],r>i)return a===e.buckets.length-1?e.max:a*.5;return e.max}setMeta(e){Object.assign(this.meta,e)}milestone(e){try{if(!e||Object.hasOwn(this.milestones,e))return;this.milestones[e]=Ht(performance.now()-this.startTime,1)}catch{}}getReport(){this.meta.duration_s=Ht((performance.now()-this.startTime)/1e3,1);let{cumulative:e,perState:t}=this._getFrameStatsForReport();return{meta:{...this.meta},frames:{total:this.frames.total,rendered:this.frames.rendered,skipped:this.frames.skipped,fps_avg_active:e.fps_avg,p50_ms:e.p50_ms,p95_ms:e.p95_ms,p99_ms:e.p99_ms,worst_ms:e.worst_ms,over20:e.over20,over33:e.over33,over100:e.over100,perState:t},memory:{...this.memory},vram:{...this.vram},cache:{...this.cache},textures:{...this.textures},milestones:{...this.milestones},samples:this.samples.slice()}}_getFrameStatsForReport(){if(this.benchMode){let n=this._computeFrameStats(this._exactActiveFrames),i={};for(let r of $c){let a=this._exactActiveFrames.filter(o=>o.state===r);a.length&&(i[r]=this._computeFrameStats(a))}return{cumulative:n,perState:i}}let e=this._computeRunningFrameStats(this._runningFrameStats),t={};for(let n of $c){let i=this._runningFrameStatsByState.get(n);i?.count&&(t[n]=this._computeRunningFrameStats(i))}return{cumulative:e,perState:t}}finalize(e={}){Object.assign(this.meta,e,{finished:!0});let t=this.getReport();return console.log("[PERF_REPORT] "+JSON.stringify(t)),this._persistReport(t),t}downloadReport(e){let t=e||this.getReport();try{let n=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),i=URL.createObjectURL(n),r=document.createElement("a"),a=t.meta?.scenario||"manual",o=t.meta?.texturePipeline||"unknown";r.href=i,r.download=`perf_${o}_${a}_${Date.now()}.json`,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(i),2e3)}catch(n){console.warn("[PERF_PROFILER] downloadReport failed:",n)}}_persist(){this._persistReport(this.getReport())}_persistReport(e){try{localStorage.setItem(qc,JSON.stringify(e))}catch(t){console.warn("[PERF_PROFILER] localStorage persist failed (quota? private mode?):",t)}}dispose(){this._samplerHandle&&clearInterval(this._samplerHandle)}}});function Bn(s,e,t){return s+(e-s)*t}function Nr(s){return Math.max(0,Math.min(1,s))}function O0(s,e,t){return Math.max(e,Math.min(t,s))}function Ta(s){let e=Nr(s);return e*e*(3-2*e)}function Fr(s,e,t,n){return{x:s.x+e*Math.sin(n)*Math.sin(t),y:s.y+e*Math.cos(n),z:s.z+e*Math.sin(n)*Math.cos(t)}}function B0(s,e){let t=s.x-e.x,n=s.y-e.y,i=s.z-e.z,r=Math.sqrt(t*t+n*n+i*i),a=r>1e-6?Math.acos(O0(n/r,-1,1)):0,o=Math.atan2(t,i);return{radius:r,phi:a,theta:o}}function Ur(s,e){let t=Math.min(s.length-1,Math.max(0,Math.floor(e*s.length)));return s[t]}function z0(s){let e=s.bounds,t=s?.tiles;if(!t||t.length<20)return{minX:0,maxX:e.max_x-e.min_x,minZ:-(e.max_y-e.min_y),maxZ:0};let n=t.map(c=>c.x).sort((c,h)=>c-h),i=t.map(c=>c.y).sort((c,h)=>c-h),r=Ur(n,.02),a=Ur(n,.98),o=Ur(i,.02),l=Ur(i,.98);return{minX:r-e.min_x,maxX:a-e.min_x,minZ:-(l-e.min_y),maxZ:-(o-e.min_y)}}function k0(s){let e=s?.bounds,t=s?.tiles;return!e||!t?[]:t.filter(n=>Number.isFinite(n.hMax)).map(n=>({x:n.x-e.min_x,z:-(n.y-e.min_y),hMax:n.hMax}))}function H0(s,e,t,n){if(s.length===0)return null;let i=n*n,r=-1/0,a=-1/0;for(let o of s){o.hMax>a&&(a=o.hMax);let l=o.x-e,c=o.z-t;l*l+c*c<=i&&o.hMax>r&&(r=o.hMax)}return r>-1/0?r:a}function G0(s){let e=[{x:s.controls.target.x,z:s.controls.target.z}],t=s.manifest,n=t?.tiles;if(n&&n.length>4&&t.bounds){let i=[...n].sort((a,o)=>a.x-o.x||a.y-o.y),r=t.bounds;for(let a of[.15,.4,.6,.85]){let o=Math.min(i.length-1,Math.floor(a*(i.length-1))),l=i[o];e.push({x:l.x-r.min_x,z:-(l.y-r.min_y)})}}return e}function V0(s,e){if(s<5)return{camPos:e.startPos,target:e.pivot};if(s<15){let c=Ta((s-5)/10);return{camPos:Fr(e.pivot,Bn(e.initialRadius,2e3,c),e.initialTheta,Bn(e.initialPhi,1.2,c)),target:e.pivot}}let a=s-5-10,o=Math.max(1,e.totalDuration-5-10),l=e.initialTheta+a/o*Math.PI*2;return{camPos:Fr(e.pivot,2e3,l,1.2),target:e.pivot}}function W0(s,e){let{minX:t,maxX:n,minZ:i,maxZ:r}=e.localBounds,a=6,o=(r-i)/a,c=Nr(s/e.totalDuration)*a,h=Math.min(a-1,Math.floor(c)),u=Nr(c-h),d=i+o*(h+.5),g={x:h%2===0?Bn(t,n,u):Bn(n,t,u),y:0,z:d};return{camPos:Fr(g,1300,0,.35),target:g}}function X0(s,e){let t=e.locations,n=t.length,i=e.totalDuration/n,r=Math.min(n-1,Math.floor(s/i)),a=Nr((s-r*i)/i),o=t[r],l={x:o.x,y:0,z:o.z},c=15e3,h=300,u=.3,d=1,p,g,x;if(a<.05)p=c,g=u,x=0;else if(a<.45){let m=Ta((a-.05)/.4);p=Bn(c,h,m),g=Bn(u,d,m),x=0}else if(a<.75){let m=(a-.45)/.3;p=h,g=d,x=m*Math.PI*1.5}else{let m=Ta((a-.75)/.25);p=Bn(h,c,m),g=Bn(d,u,m),x=Math.PI*1.5}return{camPos:Fr(l,p,x,g),target:l}}function Qc(){let s=document.createElement("div");return s.id="bench-hud",s.style.cssText=["position:fixed","top:12px","left:50%","transform:translateX(-50%)","background:rgba(10,10,10,0.75)","color:#fff","font:12px/1.4 'Courier New',monospace","padding:8px 16px","border-radius:8px","border:1px solid rgba(255,255,255,0.15)","z-index:9999","pointer-events:none","text-align:center","white-space:pre"].join(";"),document.body.appendChild(s),s}function Aa(s,e,t,n,i=!1){if(!s)return;let r=Math.min(100,t/n*100).toFixed(0);s.textContent=i?`[BENCHMARK] ${e} \u2014 DONE (${n.toFixed(0)}s)`:`[BENCHMARK] ${e} \u2014 ${t.toFixed(1)}s / ${n.toFixed(0)}s (${r}%)`}function Y0(s,e=45e3){return new Promise((t,n)=>{let i=performance.now(),r=()=>{if(s.loaderHidden&&s.manifest)return t();if(performance.now()-i>e)return n(new Error("Timed out waiting for viewer readiness (loaderHidden/manifest never became available)"));requestAnimationFrame(r)};r()})}function eh(s,e,t,n,i){Aa(e,t,n,n,!0),console.log(`[BENCHMARK] Scenario "${t}" complete.`);let r="ktx2";if(s.profiler){let a=s.profiler.finalize({scenario:t,texturePipeline:r,appVersion:i||null,timestamp:new Date().toISOString(),userAgent:navigator.userAgent});s.profiler.downloadReport(a)}else console.error("[BENCHMARK] viewer.profiler not found \u2014 cannot finalize/download the perf report.");setTimeout(()=>e?.remove(),5e3)}function q0(s,e,t,n){let i=Qc(),r=performance.now(),a=()=>{let o=(performance.now()-r)/1e3;if(s.profiler?.milestones?.visibleTexturedCoverage!==void 0||o>=t.duration){eh(s,i,e,t.duration,n);return}Aa(i,e,o,t.duration),setTimeout(a,250)};console.log(`[BENCHMARK] Starting scenario "${e}" (${t.duration}s)...`),a()}function $0(s,e,t,n){let i=Qc(),r=s.camera.position.clone(),a=s.controls.target.clone(),o=B0(r,a),l={startPos:r,startTarget:a,pivot:a.clone(),initialTheta:o.theta,initialPhi:o.phi,initialRadius:o.radius,localBounds:z0(s.manifest),totalDuration:t.duration,heightLookup:k0(s.manifest)};e==="stress"&&(l.locations=G0(s));let c=performance.now(),h=()=>eh(s,i,e,t.duration,n),u=()=>{let d=(performance.now()-c)/1e3;if(d>=t.duration){h();return}let{camPos:p,target:g}=t.fn(d,l),x=H0(l.heightLookup,p.x,p.z,1500);if(x!==null){let m=(x-s.floorState.value)*1+80;p.y<m&&(p.y=m)}s.camera.position.set(p.x,p.y,p.z),s.controls.target.set(g.x,g.y,g.z),s.notifyCameraMotion(performance.now()),s.controls.update(),s.needsRender=!0,s.needsLODUpdate=!0,Aa(i,e,d,t.duration),requestAnimationFrame(u)};console.log(`[BENCHMARK] Starting scenario "${e}" (${t.duration}s)...`),u()}function th(s,e){let t=new URLSearchParams(window.location.search).get("bench");if(!t)return;let n=jc[t];if(!n){console.error(`[BENCHMARK] Unknown scenario "${t}". Valid options: ${Object.keys(jc).join(", ")}`);return}console.log(`[BENCHMARK] Scenario "${t}" queued \u2014 waiting for the viewer's initial tile load...`),Y0(s).then(()=>{n.holdStill?q0(s,t,n,e):$0(s,t,n,e)}).catch(i=>console.error("[BENCHMARK] "+i.message))}var jc,nh=tt(()=>{jc={coldload:{duration:45,fn:null,holdStill:!0},orbit:{duration:60,fn:V0},traverse:{duration:90,fn:W0},stress:{duration:120,fn:X0}}});function sh(s){if(!s)return null;let e=s.split(",");if(e.length!==3)return null;let[t,n,i]=e.map(Number);return![t,n,i].every(Number.isFinite)||t<-90||t>90||n<-180||n>180||Math.abs(i)>1e5?null:{lat:t,lon:n,sceneY:i}}function rh(s){return`${s.lat.toFixed(8)},${s.lon.toFixed(8)},${s.sceneY.toFixed(3)}`}function qt(s,e=3){let t=10**e;return Math.round(s*t)/t}var ih,Z0,Or,oh=tt(()=>{Ea();ih="1",Z0=450;Or=class{constructor(e){this.viewer=e,this.writeTimer=null,this.userGestureChanged=!1,e.controls.addEventListener("start",()=>{this.userGestureChanged=!1,clearTimeout(this.writeTimer)}),e.controls.addEventListener("change",()=>{e.isUserInteracting&&(this.userGestureChanged=!0)}),e.controls.addEventListener("end",()=>{this.userGestureChanged&&(clearTimeout(this.writeTimer),this.writeTimer=setTimeout(()=>{e.isUserInteracting||this.replaceUrl()},Z0))});let t=document.getElementById("copy-view-link");t?.addEventListener("click",async()=>{let n=this.replaceUrl(),i=!1;try{await navigator.clipboard.writeText(n),i=!0}catch{}t.textContent=i?"COPIED":"URL UPDATED",setTimeout(()=>{t.textContent="COPY LINK"},1400)}),window.hexView={getState:()=>this.getState(),getUrl:()=>this.buildUrl().href,copyLink:()=>this.copyLink(),applyUrl:n=>this.applyUrl(n)}}sceneToGps(e){let t=e.x+this.viewer.worldOrigin.x,n=this.viewer.worldOrigin.y-e.z,i=Vc(t,n);return i?{...i,sceneY:e.y}:null}gpsToScene(e){let t=Ir(e.lat,e.lon);return{x:t.x-this.viewer.worldOrigin.x,y:e.sceneY,z:-(t.y-this.viewer.worldOrigin.y)}}getState(){let e=this.sceneToGps(this.viewer.camera.position),t=this.sceneToGps(this.viewer.controls.target);if(!e||!t)return null;let n=this.viewer.camera.position.x-this.viewer.controls.target.x,i=this.viewer.camera.position.y-this.viewer.controls.target.y,r=this.viewer.camera.position.z-this.viewer.controls.target.z,a=Math.hypot(n,r),o=Math.min(1,Math.max(0,(this.viewer.controls.getPolarAngle()*180/Math.PI-5.5)/(25-5.5))),l=this.viewer.floorState?.value,c=o>.001&&Number.isFinite(l)?l+this.viewer.camera.position.y/o:null;return{schema:1,target:{lat:qt(t.lat,8),lon:qt(t.lon,8),sceneY_m:qt(t.sceneY)},camera:{lat:qt(e.lat,8),lon:qt(e.lon,8),sceneY_m:qt(e.sceneY)},orientation:{bearing_deg:qt((Math.atan2(n,-r)*180/Math.PI+360)%360,2),pitch_deg:qt(Math.atan2(i,a)*180/Math.PI,2),range_m:qt(Math.hypot(a,i),2)},vertical:{datum:"dynamic-view-floor",floor_source_elevation_m:Number.isFinite(l)?qt(l,1):null,terrain_height_morph:qt(o,4),camera_source_elevation_estimate_m:c===null?null:qt(c,1),note:"URL sceneY values are renderer-scene meters, not absolute MSL elevations."}}}buildUrl(){let e=this.getState(),t=new URL(window.location.href);return e&&(t.searchParams.set("view",ih),t.searchParams.set("at",rh({lat:e.target.lat,lon:e.target.lon,sceneY:e.target.sceneY_m})),t.searchParams.set("eye",rh({lat:e.camera.lat,lon:e.camera.lon,sceneY:e.camera.sceneY_m}))),t}replaceUrl(){let e=this.buildUrl();return e.href!==window.location.href&&history.replaceState(history.state,"",e),e.href}async copyLink(){let e=this.replaceUrl();return await navigator.clipboard.writeText(e),e}async applyUrl(e=window.location.href){let t;try{t=e.startsWith?.("?")?new URL(e,window.location.href):new URL(e,window.location.href)}catch{return!1}if(t.searchParams.get("view")!==ih)return!1;let n=sh(t.searchParams.get("at")),i=sh(t.searchParams.get("eye"));if(!n||!i||!await us())return!1;let r=this.gpsToScene(n),a=this.gpsToScene(i),o=Math.hypot(a.x-r.x,a.y-r.y,a.z-r.z);if(!Number.isFinite(o)||o<1||o>1e5)return!1;this.viewer.bootstrapVisibilityFloor?.(r),this.viewer.controls.target.set(r.x,r.y,r.z),this.viewer.camera.position.set(a.x,a.y,a.z);let l=performance.now();return this.viewer.notifyCameraMotion(l),this.viewer.controls.update(),this.viewer.syncHeightFactorFromControls?.(),this.viewer.lastLODCamPos.copy(this.viewer.camera.position),this.viewer.needsLODUpdate=!0,this.viewer.needsRender=!0,!0}async restoreFromUrl(){let e=new URLSearchParams(window.location.search);if(!e.has("view")&&!e.has("at")&&!e.has("eye"))return await us(),!1;let t=await this.applyUrl(window.location.href);return t||this.viewer.log("Invalid shareable view URL; using the default start.","warn"),t}}});function Ct(s,e){if(!Number.isFinite(s))throw new TypeError(`${e} must be finite`);return s}function J0(s){let e=s?.elements??s;if(!e||e.length!==16)throw new TypeError("viewProjection must be a 16-element column-major matrix");return e}function zr(s,e="frustum"){if(!s||s.length!==Br*Ra)throw new TypeError(`${e} must contain six vec4 planes`);return s}function Hi(s,e,t,n,i,r){let a=Math.hypot(t,n,i);if(!(a>0)||!Number.isFinite(a))throw new RangeError("frustum contains a degenerate plane");let o=1/a;s[e]=t*o,s[e+1]=n*o,s[e+2]=i*o,s[e+3]=r*o}function lh(s,e=new Float64Array(24)){let t=J0(s);if(!e||e.length!==24)throw new TypeError("out must contain 24 numbers");return Hi(e,0,t[3]-t[0],t[7]-t[4],t[11]-t[8],t[15]-t[12]),Hi(e,4,t[3]+t[0],t[7]+t[4],t[11]+t[8],t[15]+t[12]),Hi(e,8,t[3]+t[1],t[7]+t[5],t[11]+t[9],t[15]+t[13]),Hi(e,12,t[3]-t[1],t[7]-t[5],t[11]-t[9],t[15]-t[13]),Hi(e,16,t[3]-t[2],t[7]-t[6],t[11]-t[10],t[15]-t[14]),Hi(e,20,t[3]+t[2],t[7]+t[6],t[11]+t[10],t[15]+t[14]),e}function ch(s,{marginMeters:e=0,planeMargins:t=null,predictedTranslation:n=null}={},i=new Float64Array(24)){let r=zr(s,"source");if(!i||i.length!==24)throw new TypeError("out must contain 24 numbers");if(Ct(e,"marginMeters"),e<0)throw new RangeError("marginMeters cannot be negative");if(t&&t.length!==Br)throw new TypeError("planeMargins must contain six metre values");let a=n??[0,0,0];if(a.length!==3)throw new TypeError("predictedTranslation must be a vec3");let o=Ct(Number(a[0]),"predictedTranslation.x"),l=Ct(Number(a[1]),"predictedTranslation.y"),c=Ct(Number(a[2]),"predictedTranslation.z");for(let h=0;h<Br;h++){let u=h*Ra,d=r[u],p=r[u+1],g=r[u+2],x=Math.hypot(d,p,g);if(!(x>0))throw new RangeError("source contains a degenerate plane");let m=1/x,f=d*m,b=p*m,_=g*m,M=r[u+3]*m,S=t?Ct(Number(t[h]),`planeMargins[${h}]`):0;if(S<0)throw new RangeError("planeMargins cannot be negative");let R=Math.max(0,-(f*o+b*l+_*c));i[u]=f,i[u+1]=b,i[u+2]=_,i[u+3]=M+e+S+R}return i}function ah(s,e,t=0){let n=zr(s);if(!e||e.length!==K0)throw new TypeError("bounds must be [minX,minY,minZ,maxX,maxY,maxZ]");let i=!0;for(let r=0;r<Br;r++){let a=r*Ra,o=n[a],l=n[a+1],c=n[a+2],h=n[a+3],u=o>=0?e[3]:e[0],d=l>=0?e[4]:e[1],p=c>=0?e[5]:e[2];if(o*u+l*d+c*p+h<-t)return zn.OUTSIDE;let g=o>=0?e[0]:e[3],x=l>=0?e[1]:e[4],m=c>=0?e[2]:e[5];o*g+l*x+c*m+h<t&&(i=!1)}return i?zn.INSIDE:zn.INTERSECT}function hh({position:s,forward:e,verticalFovRadians:t,viewportHeightPx:n,near:i=.1}){if(!s||s.length!==3)throw new TypeError("position must be a vec3");if(!e||e.length!==3)throw new TypeError("forward must be a vec3");let r=Ct(Number(s[0]),"position.x"),a=Ct(Number(s[1]),"position.y"),o=Ct(Number(s[2]),"position.z"),l=Ct(Number(e[0]),"forward.x"),c=Ct(Number(e[1]),"forward.y"),h=Ct(Number(e[2]),"forward.z"),u=Math.hypot(l,c,h);if(!(u>0))throw new RangeError("forward cannot be zero");let d=Ct(Number(t),"verticalFovRadians");if(!(d>0&&d<Math.PI))throw new RangeError("verticalFovRadians must be between 0 and pi");let p=Ct(Number(n),"viewportHeightPx");if(!(p>0))throw new RangeError("viewportHeightPx must be positive");let g=Ct(Number(i),"near");if(!(g>0))throw new RangeError("near must be positive");return Object.freeze({position:new Float64Array([r,a,o]),forward:new Float64Array([l/u,c/u,h/u]),focalLengthPx:.5*p/Math.tan(.5*d),viewportHeightPx:p,verticalFovRadians:d,near:g})}function j0(s,e,t=new Float64Array(3)){if(!s||s.length!==4)throw new TypeError("sphere must be [x,y,z,radius]");if(!e)return t[0]=NaN,t[1]=NaN,t[2]=NaN,t;let n=s[0]-e.position[0],i=s[1]-e.position[1],r=s[2]-e.position[2],a=Math.hypot(n,i,r),o=n*e.forward[0]+i*e.forward[1]+r*e.forward[2],l=Math.max(0,s[3]),c=0;if(l>0)if(o<=e.near+l)c=1/0;else{let h=Math.sqrt(Math.max(e.near*e.near,o*o-l*l));c=2*e.focalLengthPx*l/h}return t[0]=c,t[1]=a,t[2]=o,t}function Q0(s){for(let e of["getRoots","writeBounds","getDepth","getChildCount","getChild"])if(typeof s?.[e]!="function")throw new TypeError(`hierarchy.${e} must be a function`)}function ms({hierarchy:s,visibleFrustum:e,guardFrustum:t,projection:n=null,roots:i=null,maxDepth:r=0,refineProjectedDiameterPx:a=0,shouldRefine:o=null,epsilon:l=0}={}){Q0(s);let c=zr(e,"visibleFrustum"),h=zr(t,"guardFrustum");if(!(Number.isInteger(r)&&r>=0))throw new RangeError("maxDepth must be a non-negative integer");if(Ct(a,"refineProjectedDiameterPx"),a<0)throw new RangeError("refineProjectedDiameterPx cannot be negative");if(o!==null&&typeof o!="function")throw new TypeError("shouldRefine must be a function or null");let u=i??s.getRoots();if(!u||typeof u.length!="number")throw new TypeError("roots must be an ordered ArrayLike of handles");let d=new ps,p=new ps,g=new ps,x=new Float64Array(6),m=new Float64Array(4),f=new Float64Array(3),b=typeof s.isNodeEnabled=="function"?s.isNodeEnabled.bind(s):()=>!0,_=typeof s.writeProjectionSphere=="function",M={roots:u.length,visitedNodes:0,disabledNodes:0,planeTests:0,inheritedNodes:0,rejectedSubtrees:0,visibleSubtrees:0,guardSubtrees:0,maxDepthVisited:0};function S(E){if(_)s.writeProjectionSphere(E,m);else{let N=(x[0]+x[3])*.5,v=(x[1]+x[4])*.5,T=(x[2]+x[5])*.5;m[0]=N,m[1]=v,m[2]=T,m[3]=Math.hypot(x[3]-N,x[4]-v,x[5]-T)}j0(m,n,f)}function R(E,N){if(E=Number(E),!(Number.isInteger(E)&&E>=0&&E<=4294967295))throw new RangeError(`invalid opaque node handle: ${E}`);if(!b(E)){M.disabledNodes++;return}let v=s.getDepth(E);if(!(Number.isInteger(v)&&v>=0))throw new RangeError(`hierarchy returned invalid depth for ${E}`);M.visitedNodes++,M.maxDepthVisited=Math.max(M.maxDepthVisited,v),s.writeBounds(E,x),S(E);let T=N,F=zn.INSIDE;if(N===null){let I=ah(c,x,l);if(M.planeTests++,I!==zn.OUTSIDE)T=un.VISIBLE,F=I;else{let U=ah(h,x,l);if(M.planeTests++,U!==zn.OUTSIDE)T=un.GUARD,F=U;else{g.push(E,f,zn.OUTSIDE),M.rejectedSubtrees++;return}}}else M.inheritedNodes++;let X=s.getChildCount(E);if(!(Number.isInteger(X)&&X>=0))throw new RangeError(`hierarchy returned invalid child count for ${E}`);let j=X>0&&v<r;if(j&&(o?j=!!o(E,v,f[0],T,F):j=!Number.isFinite(f[0])||f[0]>a),j){let I=F===zn.INSIDE?T:null,U=0;for(let V=0;V<X;V++){let Y=s.getChild(E,V);if(!b(Y)){M.disabledNodes++;continue}U++,R(Y,I)}if(U>0)return}T===un.VISIBLE?(d.push(E,f,F),M.visibleSubtrees++):(p.push(E,f,F),M.guardSubtrees++)}for(let E=0;E<u.length;E++)R(u[E],null);return Object.freeze({visible:d.finish(),guard:p.finish(),outside:g.finish(),stats:Object.freeze(M)})}var zn,un,Br,Ra,K0,ps,kr=tt(()=>{zn=Object.freeze({OUTSIDE:0,INTERSECT:1,INSIDE:2}),un=Object.freeze({OUTSIDE:0,GUARD:1,VISIBLE:2}),Br=6,Ra=4,K0=6;ps=class{constructor(e=32){this.length=0,this.nodeIds=new Uint32Array(e),this.projectedDiameterPx=new Float32Array(e),this.distanceMeters=new Float32Array(e),this.viewDepthMeters=new Float32Array(e),this.containment=new Uint8Array(e)}grow(){let e=Math.max(16,this.nodeIds.length*2);for(let t of["nodeIds","projectedDiameterPx","distanceMeters","viewDepthMeters","containment"]){let n=this[t],i=new n.constructor(e);i.set(n),this[t]=i}}push(e,t,n){this.length===this.nodeIds.length&&this.grow();let i=this.length++;this.nodeIds[i]=e,this.projectedDiameterPx[i]=t[0],this.distanceMeters[i]=t[1],this.viewDepthMeters[i]=t[2],this.containment[i]=n}finish(){return Object.freeze({nodeIds:this.nodeIds.slice(0,this.length),projectedDiameterPx:this.projectedDiameterPx.slice(0,this.length),distanceMeters:this.distanceMeters.slice(0,this.length),viewDepthMeters:this.viewDepthMeters.slice(0,this.length),containment:this.containment.slice(0,this.length)})}}});function ph(s,e){return`${s}_${e}`}function gs(s,e){if(!Number.isInteger(s))throw new TypeError(`${e} must be an integer`);return s}function Pa(s){return s<wn[1]?0:s<wn[2]?1:s<wn[3]?2:s<wn[4]?3:s<wn[5]?4:5}function xs(s,...e){for(let t of e)if(s?.[t]!==void 0)return s[t];return null}var Kx,ex,Ca,Ia,tx,nx,ix,uh,dh,je,_s,wn,$t,fh,Hr,La=tt(()=>{Kx=oo(Pr());kr();ex=globalThis.GosperCore,Ca=7,Ia=1.15,tx=.1,nx=24,ix=12,uh=400,dh=6,je=5,_s=Object.freeze([1,7,49,343,2401,16807]),wn=Object.freeze([0,1,8,57,400,2801]),$t=19608,fh=Object.freeze([1,7,49,343,2401,16807]);Hr=class{constructor({manifest:e=null,manifestTiles:t=null,worldOrigin:n={x:0,y:0},core:i=ex,capOverscan:r=Ia,rootHeightRoundingM:a=tx,aggregateSkirtSafetyM:o=nx,unitSkirtSafetyM:l=ix}={}){if(!i)throw new Error("GosperCore is unavailable");let c=t??e?.tiles;if(!Array.isArray(c))throw new TypeError("manifestTiles must be an array");if(!(Number.isFinite(r)&&r>=1))throw new RangeError("capOverscan must be at least 1");this.core=i,this.maxDepth=je,this._rootHeightRoundingM=a,this._aggregateSkirtSafetyM=o,this._unitSkirtSafetyM=l,this._verticalFactor=1,this._verticalFloor=0,this._verticalOffset=0,this._addressScratch={island:0,local:0,depth:0,index:0},this._rawHeightScratch=new Float64Array(2);let h=c.slice().sort((x,m)=>x.yq-m.yq||x.yr-m.yr);this.islandCount=h.length;let u=Math.floor(4294967296/$t);if(h.length>u)throw new RangeError(`uint32 node handles support at most ${u} islands`);this._rootHandles=new Uint32Array(h.length),this._latticeQ=new Int32Array(h.length),this._latticeR=new Int32Array(h.length),this._rootX=new Float64Array(h.length),this._rootZ=new Float64Array(h.length),this._rootMean=new Float64Array(h.length),this._rootMin=new Float64Array(h.length),this._rootMax=new Float64Array(h.length),this._gspVersion=new Uint8Array(h.length),this._keys=new Array(h.length),this._islandByKey=new Map,this._decodedByIsland=new Array(h.length).fill(null);let d=Number(n?.x??0),p=Number(n?.y??0);for(let x=0;x<h.length;x++){let m=h[x],f=gs(m.yq,"tile.yq"),b=gs(m.yr,"tile.yr"),_=ph(f,b);if(this._islandByKey.has(_))throw new Error(`duplicate Gosper island ${_}`);let M=Number.isFinite(m.lx)?Number(m.lx):Number(m.x)-d,S=Number.isFinite(m.lz)?Number(m.lz):-(Number(m.y)-p),R=Number(m.hMean),E=Number(m.hMin),N=Number(m.hMax);if(![M,S,R,E,N].every(Number.isFinite)||E>N)throw new RangeError(`invalid manifest bounds for Gosper island ${_}`);this._rootHandles[x]=x*$t,this._latticeQ[x]=f,this._latticeR[x]=b,this._rootX[x]=M,this._rootZ[x]=S,this._rootMean[x]=R,this._rootMin[x]=E,this._rootMax[x]=N,this._gspVersion[x]=Number(m.gspVersion??e?.gsp_version??1),this._keys[x]=_,this._islandByKey.set(_,x)}this.horizontalRadiusByLevel=new Float64Array(dh);for(let x=0;x<=je;x++){let m=x===0?1:r;this.horizontalRadiusByLevel[x]=i.levelSize(x)/Math.sqrt(3)*m}this._localCenterX=new Float64Array($t),this._localCenterZ=new Float64Array($t);let g=i.offsets(je);for(let x=0;x<=je;x++){let m=_s[x],f=fh[je-x],b=wn[x];for(let _=0;_<m;_++){let M=_*f,S=g[M*2],R=g[M*2+1],E=i.axialToWorld(S,R);this._localCenterX[b+_]=E[0],this._localCenterZ[b+_]=-E[1]}}}getRoots(){return this._rootHandles}getIslandIndex(e){let t=this._assertHandle(e);return Math.floor(t/$t)}getIslandKey(e){return this._assertIslandIndex(e),this._keys[e]}getIslandVersion(e){return this._assertIslandIndex(e),this._gspVersion[e]}writeIslandLattice(e,t=new Int32Array(2)){return this._assertIslandIndex(e),t[0]=this._latticeQ[e],t[1]=this._latticeR[e],t}getRootHandle(e){let t;if(typeof e=="string"){if(t=this._islandByKey.get(e),t===void 0)return null}else t=this._assertIslandIndex(e);return this._rootHandles[t]}getRootHandleForLattice(e,t){return this.getRootHandle(ph(e,t))}getDepth(e){let n=this._assertHandle(e)%$t;return Pa(n)}getLevel(e){return je-this.getDepth(e)}getChildCount(e){return this.getDepth(e)<je?Ca:0}getChild(e,t){let n=this._assertHandle(e);if(gs(t,"childIndex"),t<0||t>=Ca)throw new RangeError("childIndex must be 0..6");let i=Math.floor(n/$t),r=n-i*$t,a=Pa(r);if(a===je)throw new RangeError("unit nodes have no children");let o=r-wn[a];return i*$t+wn[a+1]+o*Ca+t}isNodeEnabled(e){let t=this._address(e),i=this._decodedByIsland[t.island]?.depths?.[t.depth]?.valid;return i?i[t.index]!==0:!0}attachDecodedIsland(e,t){let n=this._resolveIsland(e),i=t?.depths;if(!Array.isArray(i)||i.length!==dh)throw new TypeError("decoded.depths must contain depths 0..5");for(let r=0;r<=je;r++){let a=i[r],o=_s[r];if(!a?.h||a.h.length!==o)throw new RangeError(`decoded depth ${r} needs ${o} heights`);if(a.valid&&a.valid.length!==o)throw new RangeError(`decoded depth ${r} validity length mismatch`);for(let l of["relief","downExtent","upExtent","renderDown","renderUp"])if(a[l]&&a[l].length!==o)throw new RangeError(`decoded depth ${r} ${l} length mismatch`)}this._decodedByIsland[n]=t}detachDecodedIsland(e){this._decodedByIsland[this._resolveIsland(e)]=null}setVerticalTransform({factor:e=1,floor:t=0,offset:n=0}={}){for(let[i,r]of Object.entries({factor:e,floor:t,offset:n}))if(!Number.isFinite(r))throw new TypeError(`${i} must be finite`);this._verticalFactor=e,this._verticalFloor=t,this._verticalOffset=n}writeBounds(e,t=new Float64Array(6)){let n=this._address(e),i=n.local,r=je-n.depth,a=this.horizontalRadiusByLevel[r],o=this._rootX[n.island]+this._localCenterX[i],l=this._rootZ[n.island]+this._localCenterZ[i],c=this._rawHeightBounds(n),h=this._toSceneY(c[0]),u=this._toSceneY(c[1]);return t[0]=o-a,t[1]=Math.min(h,u),t[2]=l-a,t[3]=o+a,t[4]=Math.max(h,u),t[5]=l+a,t}writeProjectionSphere(e,t=new Float64Array(4)){let n=this._address(e),i=n.local,r=je-n.depth;return t[0]=this._rootX[n.island]+this._localCenterX[i],t[1]=this._toSceneY(this._nodeMean(n)),t[2]=this._rootZ[n.island]+this._localCenterZ[i],t[3]=this.horizontalRadiusByLevel[r],t}writeNodeAddress(e,t=new Uint32Array(4)){let n=this._address(e);return t[0]=n.island,t[1]=n.depth,t[2]=n.index,t[3]=je-n.depth,t}writeDescendantRange(e,t,n=new Uint32Array(4)){let i=this._address(e);if(gs(t,"targetDepth"),t<i.depth||t>je)throw new RangeError(`targetDepth must be ${i.depth}..${je}`);let r=fh[t-i.depth];return n[0]=i.island,n[1]=i.index*r,n[2]=r,n[3]=t,n}summarizePlanByIsland(e){let t=new Uint8Array(this.islandCount),n=new Float32Array(this.islandCount),i=new Float32Array(this.islandCount),r=new Float32Array(this.islandCount),a=new Uint8Array(this.islandCount);i.fill(1/0),r.fill(1/0);let o=(l,c)=>{for(let h=0;h<l.nodeIds.length;h++){let u=this.getIslandIndex(l.nodeIds[h]);a[u]=1,t[u]=Math.max(t[u],c),n[u]=Math.max(n[u],l.projectedDiameterPx[h]),i[u]=Math.min(i[u],l.distanceMeters[h]),r[u]=Math.min(r[u],l.viewDepthMeters[h])}};return o(e.outside,un.OUTSIDE),o(e.guard,un.GUARD),o(e.visible,un.VISIBLE),Object.freeze({classification:t,projectedDiameterPx:n,distanceMeters:i,viewDepthMeters:r,present:a})}_resolveIsland(e){if(typeof e=="string"){let t=this._islandByKey.get(e);if(t===void 0)throw new RangeError(`unknown Gosper island ${e}`);return t}return this._assertIslandIndex(e)}_assertIslandIndex(e){if(gs(e,"islandIndex"),e<0||e>=this.islandCount)throw new RangeError(`islandIndex ${e} is out of range`);return e}_assertHandle(e){let t=Number(e);if(!(Number.isInteger(t)&&t>=0&&t<this.islandCount*$t))throw new RangeError(`invalid Gosper node handle ${e}`);return t}_address(e){let t=this._assertHandle(e),n=Math.floor(t/$t),i=t-n*$t,r=Pa(i),a=this._addressScratch;return a.island=n,a.local=i,a.depth=r,a.index=i-wn[r],a}_nodeMean(e){let n=this._decodedByIsland[e.island]?.depths?.[e.depth]?.h?.[e.index];return Number.isFinite(n)?n:this._rootMean[e.island]}_rawHeightBounds(e){let t=this._rawHeightScratch,n=e.island,i=this._rootMin[n]-this._rootHeightRoundingM,r=this._rootMax[n]+this._rootHeightRoundingM,a=Math.min(i,this._rootMean[n]-(r-i)-this._aggregateSkirtSafetyM,i-uh-this._unitSkirtSafetyM),o=r+uh,l=this._decodedByIsland[n];if(e.depth===0||!l)return t[0]=a,t[1]=o,t;let c=l.depths[e.depth],h=this._nodeMean(e);if(e.depth===je){let p=xs(l.unit,"d1"),g=xs(l.unit,"d2"),x=xs(l.unit,"d3");if(p&&g&&x){let m=h-Number(p[e.index])*.1,f=h-Number(g[e.index])*.1,b=h-Number(x[e.index])*.1;return t[0]=Math.min(h,m-this._unitSkirtSafetyM,f-this._unitSkirtSafetyM,b-this._unitSkirtSafetyM)-.1,t[1]=Math.max(h,m,f,b)+.1,t}return t[0]=a,t[1]=o,t}if(this._gspVersion[n]<3)return t[0]=a,t[1]=o,t;let u=xs(c,"renderDown"),d=xs(c,"renderUp");return u&&d?(t[0]=h-Number(u[e.index])*.1,t[1]=h+Number(d[e.index])*.1,t):(t[0]=a,t[1]=o,t)}_toSceneY(e){return(e-this._verticalFloor)*this._verticalFactor+this._verticalOffset}}});function rx(s){let e=0;for(let t=1;t<s.length;t+=2)e+=s[t];return e}function gh(s){if(s.length===0)return new Uint32Array;s.sort((i,r)=>i[0]-r[0]||i[1]-r[1]);let e=[],t=s[0][0],n=t+s[0][1];for(let i=1;i<s.length;i++){let r=s[i][0],a=r+s[i][1];r<=n?n=Math.max(n,a):(e.push(t,n-t),t=r,n=a)}return e.push(t,n-t),new Uint32Array(e)}function mh(s,e){let t=[],n=0;for(;n<s.length;){for(;n<s.length&&!!s[n]!==e;)n++;let i=n;for(;n<s.length&&!!s[n]===e;)n++;n>i&&t.push([i,n-i])}return gh(t)}function xh(s,e){if(!s)return!0;for(let t=dn+1;t<=je;t++){let n=s.rangesByDepth[t],i=e.rangesByDepth[t];if(!n||!i||n.length!==i.length)return!0;for(let r=0;r<n.length;r++)if(n[r]!==i[r])return!0}return!1}function _h({adapter:s,rootHandle:e,visibleFrustum:t,guardFrustum:n,projection:i,detailDistanceByDepth:r=sx,detailMarginMeters:a=650}){if(!s)throw new TypeError("adapter is required");if(!r||r.length<=je)throw new TypeError("detailDistanceByDepth must contain depths 0..5");let o=ms({hierarchy:s,roots:new Uint32Array([e]),visibleFrustum:t,guardFrustum:n,projection:i,maxDepth:dn}),l=new Uint8Array(_s[dn]),c=new Uint8Array(l.length),h=Array.from({length:je+1},()=>[]),u=new Uint32Array(4),d=new Uint32Array(4),p=s.horizontalRadiusByLevel[je-dn];function g(_,M){for(let S=0;S<_.nodeIds.length;S++){let R=_.nodeIds[S];if(s.writeNodeAddress(R,u),u[1]!==dn)throw new Error(`geometry frontier stopped at depth ${u[1]}, expected L3/depth 2`);let E=u[2];l[E]=1,M&&(c[E]=1);let N=_.distanceMeters[S];for(let v=dn+1;v<=je;v++){let T=Number(r[v]);Number.isFinite(N)&&N-p<=T+a&&(s.writeDescendantRange(R,v,d),h[v].push([d[1],d[2]]))}}}g(o.visible,!0),g(o.guard,!1);let x=new Array(je+1);for(let _=0;_<=dn;_++)x[_]=new Uint32Array([0,_s[_]]);for(let _=dn+1;_<=je;_++)x[_]=gh(h[_]);let m=new Uint32Array(je+1),f=0;for(let _=0;_<=je;_++)m[_]=rx(x[_]),_>dn&&(f+=m[_]);let b=x.slice(dn+1).map(_=>Array.from(_).join(",")).join("|");return Object.freeze({rangesByDepth:x,selectedCounts:m,detailNodeCount:f,activeL3Count:l.reduce((_,M)=>_+M,0),visibleL3Count:c.reduce((_,M)=>_+M,0),excludedL3Count:l.length-l.reduce((_,M)=>_+M,0),activeL3Ranges:mh(l,!0),outsideL3Ranges:mh(l,!1),signature:b,plannerStats:o.stats})}var dn,sx,yh=tt(()=>{kr();La();dn=2,sx=Object.freeze([1/0,1/0,1/0,1e4,5e3,2e3])});function vh(s){return!!s}function Vr(s,e,t=new Float64Array(10)){if(!s?.position||!s?.quaternion||!e)throw new TypeError("camera position/quaternion and controls target are required");return t[0]=s.position.x,t[1]=s.position.y,t[2]=s.position.z,t[3]=s.quaternion.x,t[4]=s.quaternion.y,t[5]=s.quaternion.z,t[6]=s.quaternion.w,t[7]=e.x,t[8]=e.y,t[9]=e.z,t}function Mh(s,e,t=1e-7){if(!s||!e||s.length!==10||e.length!==10)throw new TypeError("camera poses must contain 10 values");for(let n=0;n<10;n++)if(Math.abs(s[n]-e[n])>t)return!0;return!1}function Da(s,e=2){return e>=2&&s?ox:ax}function Sh(s,e){return!!(s||e)}function bh(s,e){return s.lodPaused=!!e,s.lodPaused||(s.needsLODUpdate=!0,s.needsRender=!0),s.lodPaused}function Wr({taskEpoch:s,currentEpoch:e,taskSignature:t,desiredSignature:n,taskMode:i,isMovingView:r}){return s===e&&t===n&&i===(r?"moving":"settled")}var ox,ax,Gr,Eh=tt(()=>{ox=Object.freeze([5,4,3]),ax=Object.freeze([5,4,3,2,1,0]),Gr=class{constructor(e=200){if(!Number.isFinite(e)||e<0)throw new TypeError("settleDelayMs must be a non-negative finite number");this.settleDelayMs=e,this.lastMotionTime=-1/0}note(e){if(!Number.isFinite(e))throw new TypeError("motion time must be finite");this.lastMotionTime=Math.max(this.lastMotionTime,e)}enterMotion(e,t){return this.note(e),!t}sample({now:e}={}){if(!Number.isFinite(e))throw new TypeError("sample time must be finite");return e-this.lastMotionTime<=this.settleDelayMs}}});function wh(s,e=null){if(!s||typeof s[Symbol.iterator]!="function")return NaN;let t=Number(e?.x),n=Number(e?.z);if(!Number.isFinite(t)||!Number.isFinite(n))return NaN;let i=1/0,r=1/0;for(let a of s){let o=Number(a?.hMin);if(!Number.isFinite(o))continue;let l=Number(a?.lx),c=Number(a?.lz);if(!Number.isFinite(l)||!Number.isFinite(c))continue;let h=(l-t)**2+(c-n)**2;h<r&&(r=h,i=o)}return Number.isFinite(i)?i:NaN}function Th({cameraY:s,targetY:e,sourceElevation:t,floor:n,factor:i}){let r={cameraY:s,targetY:e,sourceElevation:t,floor:n,factor:i};for(let[l,c]of Object.entries(r))if(!Number.isFinite(c))throw new TypeError(`${l} must be finite`);if(i<0)throw new RangeError("factor must be non-negative");let a=(t-n)*i,o=a-e;return Object.freeze({terrainY:a,translationY:o,targetY:a,cameraY:s+o})}function Ah({cameraY:s,sourceElevation:e,floor:t,factor:n,clearance:i=50}){let r={cameraY:s,sourceElevation:e,floor:t,factor:n,clearance:i};for(let[c,h]of Object.entries(r))if(!Number.isFinite(h))throw new TypeError(`${c} must be finite`);if(n<0)throw new RangeError("factor must be non-negative");if(i<0)throw new RangeError("clearance must be non-negative");let a=(e-t)*n,o=a+i,l=Math.max(s,o);return Object.freeze({terrainY:a,minCameraY:o,cameraY:l,clamped:l!==s})}var Rh=tt(()=>{});function Lt(s,e){let t=Number(s);if(!Number.isFinite(t))throw new TypeError(`${e} must be finite`);return t}function Gi(s,e){let t=Number(s);if(!Number.isInteger(t))throw new TypeError(`${e} must be an integer`);return t}function Ch(s,e){return`${Gi(s,"pageX")}_${Gi(e,"pageY")}`}function Xr(s,e,t){let n=Lt(s,"coordinate"),i=Lt(e,"origin"),r=Lt(t,"pageSize");if(!(r>0))throw new RangeError("pageSize must be positive");return Math.floor((n-i)/r)}function Ph(s,e,t,n){let i=(s-e)/t;return Math.max(n,Math.ceil(i)-1)}function lx(s){if(!s||typeof s!="object")throw new TypeError("bounds must be an object");let e=Lt(s.minX??s.min_x,"bounds.minX"),t=Lt(s.minY??s.min_y,"bounds.minY"),n=Lt(s.maxX??s.max_x,"bounds.maxX"),i=Lt(s.maxY??s.max_y,"bounds.maxY");if(n<e||i<t)throw new RangeError("bounds must be ordered");return{minX:e,minY:t,maxX:n,maxY:i}}function cx(s,e,t,n){return s.replace("{page_x}",String(e)).replace("{page_y}",String(t)).replace("{tier}",String(n))}var Yr,Ih=tt(()=>{Yr=class{constructor(e,{expectedCrs:t=null}={}){if(!e||typeof e!="object")throw new TypeError("texture page contract is required");let n=e.grid;if(!n||typeof n!="object")throw new TypeError("texture page grid is required");if(n.index_rule!=="floor")throw new Error("texture page index_rule must be 'floor'");if(this.crs=String(n.crs||""),t!==null&&this.crs!==t)throw new Error(`texture page CRS must be ${t}, got ${this.crs||"<missing>"}`);if(this.originX=Lt(n.origin_x,"grid.origin_x"),this.originY=Lt(n.origin_y,"grid.origin_y"),this.pageSize=Lt(n.page_size_m,"grid.page_size_m"),!(this.pageSize>0))throw new RangeError("grid.page_size_m must be positive");this.urlTemplate=String(e.url_template||""),this.cacheKey=e.cache_key??e.recipe_version??"",this.contract=e,this.pages=[],this.pageByKey=new Map;for(let i of e.pages||[]){let r=Gi(i.page_x,"page.page_x"),a=Gi(i.page_y,"page.page_y"),o=Ch(r,a);if(i.key!==void 0&&String(i.key)!==o)throw new Error(`page key ${i.key} does not match ${o}`);if(this.pageByKey.has(o))throw new Error(`duplicate texture page ${o}`);let l=this.cell(r,a);for(let[g,x]of[["min_x",l.minX],["min_y",l.minY],["max_x",l.maxX],["max_y",l.maxY]])if(i[g]!==void 0&&Math.abs(Number(i[g])-x)>1e-6)throw new Error(`page ${o} ${g} is not aligned to the global grid`);let c=Lt(i.hMin,`page ${o} hMin`),h=Lt(i.hMax,`page ${o} hMax`);if(h<c)throw new RangeError(`page ${o} height bounds must be ordered`);let u=Lt(i.renderMin,`page ${o} renderMin`),d=Lt(i.renderMax,`page ${o} renderMax`);if(d<u||u>c||d<h)throw new RangeError(`page ${o} rendered height bounds must conservatively contain terrain`);let p=Object.freeze({key:o,pageX:r,pageY:a,minX:l.minX,minY:l.minY,maxX:l.maxX,maxY:l.maxY,hMin:c,hMax:h,renderMin:u,renderMax:d,coverageTileCount:Number(i.coverage_tile_count||0),urls:Object.freeze({...i.urls||{}}),available:!0});this.pages.push(p),this.pageByKey.set(o,p)}this.pages.sort((i,r)=>i.pageY-r.pageY||i.pageX-r.pageX),Object.freeze(this.pages)}indicesForPoint(e,t){return Object.freeze({pageX:Xr(e,this.originX,this.pageSize),pageY:Xr(t,this.originY,this.pageSize)})}cell(e,t){e=Gi(e,"pageX"),t=Gi(t,"pageY");let n=this.originX+e*this.pageSize,i=this.originY+t*this.pageSize,r=Ch(e,t),a=this.pageByKey?.get(r);return a||Object.freeze({key:r,pageX:e,pageY:t,minX:n,minY:i,maxX:n+this.pageSize,maxY:i+this.pageSize,hMin:0,hMax:0,renderMin:0,renderMax:0,coverageTileCount:0,urls:Object.freeze({}),available:!1})}pageForPoint(e,t,{includeMissing:n=!0}={}){let{pageX:i,pageY:r}=this.indicesForPoint(e,t),a=this.cell(i,r);return a.available||n?a:null}pagesForBounds(e,{includeMissing:t=!0,maxPages:n=1/0}={}){let i=lx(e),r=Xr(i.minX,this.originX,this.pageSize),a=Xr(i.minY,this.originY,this.pageSize),o=Ph(i.maxX,this.originX,this.pageSize,r),l=Ph(i.maxY,this.originY,this.pageSize,a),c=(o-r+1)*(l-a+1);if(c>n)throw new RangeError(`bounds intersect ${c} texture pages; maximum is ${n}`);let h=[];for(let u=a;u<=l;u++)for(let d=r;d<=o;d++){let p=this.cell(d,u);(p.available||t)&&h.push(p)}return h}urlFor(e,t){let n=typeof e=="string"?this.pageByKey.get(e):e;if(!n?.available)return null;let i=n.urls?.[t];return i||(this.urlTemplate?cx(this.urlTemplate,n.pageX,n.pageY,t):null)}}});function hx(s,e){return!!(s?.assets?.has(e)||s?.failed?.has(e))}function $r(s,{includeOutside:e=!1}={}){return!!(s&&(e||s.classification!=="outside"))}function ux(s,{includeOutside:e=!0}={}){let t=s instanceof Map?s.values():s||[];for(let n of t)if($r(n,{includeOutside:e})&&!hx(n,ht.LOW))return!0;return!1}function Lh(s,e,{includeOutside:t=!1}={}){let n=[];for(let i of s||[]){let r=e?.get?.(i?.key)||null,a=$r(r,{includeOutside:t}),o=kn[r?.desiredTier??ht.LOW],l=kn[i?.tier],c=t||Number.isFinite(l)&&Number.isFinite(o)&&l<=o;a&&c?n.push(i):r&&i?.tier&&r.queued?.delete?.(i.tier)}return n}function Dh(s,e,{isMoving:t=!1,lowCoverageFirst:n=!1,lowCoverageIncludesOutside:i=!0}={}){let r=n&&ux(e,{includeOutside:i}),a=-1,o=-1/0;for(let l=0;l<(s||[]).length;l++){let c=s[l];if(!c||t&&c.tier===ht.HIGH||r&&c.tier!==ht.LOW)continue;let h=Number.isFinite(c.priority)?c.priority:0;(a<0||h>o)&&(a=l,o=h)}return a}function dx(s,e,t,n){if(t==="outside")return ht.LOW;let i=s.desiredTier||ht.LOW,r=n.highEnterPx*n.hysteresis;return t==="visible"&&(i===ht.HIGH&&e>=r||e>=n.highEnterPx)?ht.HIGH:i!==ht.LOW&&e>=n.mediumExitPx||e>=n.mediumEnterPx?ht.MEDIUM:ht.LOW}var ht,kn,Ua,qr,Uh=tt(()=>{ht=Object.freeze({LOW:"low128",MEDIUM:"medium256",HIGH:"high4096"}),kn=Object.freeze({[ht.LOW]:0,[ht.MEDIUM]:1,[ht.HIGH]:2});Ua=Object.freeze({outside:0,guard:1,visible:2});qr=class{constructor({pages:e,mini:t=!1,mediumEnterPx:n=96,mediumExitPx:i=72,highEnterPx:r=512,hysteresis:a=.75}){this.mini=!!t,this.thresholds={mediumEnterPx:n,mediumExitPx:i,highEnterPx:r,hysteresis:a},this.states=new Map,this.consumerPages=new Map;for(let o of e||[]){if(!o?.key)throw new TypeError("every texture page needs a key");if(this.states.has(o.key))throw new Error(`duplicate texture page ${o.key}`);this.states.set(o.key,{key:o.key,page:o,consumers:new Set,assets:new Map,loading:new Set,queued:new Set,failed:new Set,desiredTier:ht.LOW,activeTier:null,classification:"outside",projectedDiameterPx:0,perceptibility:0,_nextClassification:"outside",_nextProjectedDiameterPx:0,_nextPerceptibility:0})}}state(e){let t=typeof e=="string"?e:e?.key;return this.states.get(t)||null}attachConsumer(e,t){this.detachConsumer(e);let n=Array.from(new Set(t||[]));this.consumerPages.set(e,n);for(let i of n)this.states.get(i)?.consumers.add(e);return n}detachConsumer(e){let t=this.consumerPages.get(e);if(t){for(let n of t)this.states.get(n)?.consumers.delete(e);this.consumerPages.delete(e)}}pagesForConsumer(e){return[...this.consumerPages.get(e)||[]]}beginDemandPass(){for(let e of this.states.values())e._nextClassification="outside",e._nextProjectedDiameterPx=0,e._nextPerceptibility=0}contribute(e,{classification:t="outside",projectedDiameterPx:n=0,perceptibility:i=0}={}){let r=this.state(e);if(!r)return null;if(!(t in Ua))throw new Error(`unknown classification ${t}`);return Ua[t]>Ua[r._nextClassification]&&(r._nextClassification=t),r._nextProjectedDiameterPx=Math.max(r._nextProjectedDiameterPx,Number.isFinite(n)?n:1/0),r._nextPerceptibility=Math.max(r._nextPerceptibility,Number.isFinite(i)?i:0),r}finishDemandPass({highEnterPx:e=null}={}){let t=e===null?this.thresholds:{...this.thresholds,highEnterPx:e};for(let n of this.states.values())n.classification=n._nextClassification,n.projectedDiameterPx=n._nextProjectedDiameterPx,n.perceptibility=n._nextPerceptibility,n.desiredTier=dx(n,n.projectedDiameterPx,n.classification,t);return this.states.values()}bestAsset(e,t=null,n=null){let i=typeof e=="string"?this.state(e):e;if(!i)return null;let r=t||i.desiredTier,a=kn[r],o=Array.from(i.assets.entries()).filter(([c])=>c!==n).sort((c,h)=>kn[h[0]]-kn[c[0]]);return o.find(([c])=>kn[c]<=a)||o[o.length-1]||null}replaceAsset(e,t,n,{rebind:i=()=>{},dispose:r=()=>{}}={}){let a=this.state(e);if(!a)throw new Error(`unknown texture page ${e}`);let o=a.assets.get(t)||null;return a.assets.set(t,n),o&&a.activeTier===t&&i(a),o&&r(o),o}dropAsset(e,t,n,{rebind:i=()=>{},dispose:r=()=>{}}={}){let a=this.state(e);if(!a)return!1;let o=a.assets.get(t);if(!o)return!0;if(a.activeTier===t){if(!n)return!1;a.assets.delete(t),a.activeTier=n[0],i(a)}else a.assets.delete(t);return r(o),!0}}});function px(){return Object.fromEntries(Hn.map(s=>[s.tier,new Set]))}function Na(){return Object.fromEntries(Hn.map(s=>[s.tier,0]))}function Nh(s){return s?.entries||Array.isArray(s)?s.entries():Object.entries(s||{})}function Fh(s,e){return s?.get&&s.get(e)?.classification||null}function Fa(s,e){if(!s||s.visible===!1)return;let t=!Number.isFinite(s.count)||s.count>0;if(s.material&&t){let n=Array.isArray(s.material)?s.material:[s.material];for(let i of n)i?.visible!==!1&&e(i)}for(let n of s.children||[])Fa(n,e)}function Oh(s,e){let t=px();for(let[n,i]of Nh(s))!i||i.container?.visible===!1||i.mesh?.visible===!1||Fh(e,n)==="visible"&&Fa(i.mesh,r=>{let a=r.userData?.texturePageBindings;if(Array.isArray(a))for(let o of a){let l=o?.tier,c=o?.page?.key;!o?.valid||!o?.texture||!c||!fx.has(l)||t[l].add(String(c))}});return t}function Bh(s,e){let t=0;for(let[n,i]of Nh(s)){if(!i||i.container?.visible===!1||i.mesh?.visible===!1||Fh(e,n)!=="visible")continue;let r=!1;Fa(i.mesh,a=>{if(r)return;let o=a.userData?.texturePageBindings;if(Array.isArray(o)){for(let l of o)if(l?.page?.available&&(!l?.valid||!l?.texture)){r=!0;return}}}),r&&t++}return t}function zh(s){let e=Na(),t=Na(),n=Na(),i=s?.values?s.values():s||[];for(let r of i)for(let{tier:a}of Hn)r?.assets?.has(a)&&e[a]++,(r?.queued?.has(a)||r?.loading?.has(a))&&t[a]++,r?.failed?.has(a)&&n[a]++;return{loaded:e,pending:t,failed:n}}var Hn,fx,kh=tt(()=>{Hn=Object.freeze([Object.freeze({tier:"low128",label:"LOW",size:128,color:"#00ff30"}),Object.freeze({tier:"medium256",label:"MED",size:256,color:"#0060ff"}),Object.freeze({tier:"high4096",label:"HIGH",size:4096,color:"#ff00aa"})]),fx=new Set(Hn.map(s=>s.tier))});var Zr,Hh=tt(()=>{Zr=class{constructor({pages:e,worldOrigin:t}){if(!Array.isArray(e))throw new TypeError("pages must be an array");if(!t||!Number.isFinite(t.x)||!Number.isFinite(t.y))throw new TypeError("worldOrigin must contain finite x/y");this.pages=e,this.worldOrigin={x:t.x,y:t.y},this.roots=Uint32Array.from(e.map((n,i)=>i)),this.verticalFactor=1,this.verticalFloor=0,this.verticalOffset=0}getRoots(){return this.roots}getDepth(){return 0}getChildCount(){return 0}getChild(){throw new RangeError("texture pages have no children")}getPage(e){let t=this.pages[Number(e)];if(!t)throw new RangeError(`invalid texture page handle ${e}`);return t}getPageKey(e){return this.getPage(e).key}setVerticalTransform({factor:e=1,floor:t=0,offset:n=0}={}){for(let[i,r]of Object.entries({factor:e,floor:t,offset:n}))if(!Number.isFinite(r))throw new TypeError(`${i} must be finite`);this.verticalFactor=e,this.verticalFloor=t,this.verticalOffset=n}sourceHeightToScene(e){return(e-this.verticalFloor)*this.verticalFactor+this.verticalOffset}writeBounds(e,t=new Float64Array(6)){let n=this.getPage(e),i=this.sourceHeightToScene(n.renderMin),r=this.sourceHeightToScene(n.renderMax);return t[0]=n.minX-this.worldOrigin.x,t[1]=Math.min(i,r),t[2]=-(n.maxY-this.worldOrigin.y),t[3]=n.maxX-this.worldOrigin.x,t[4]=Math.max(i,r),t[5]=-(n.minY-this.worldOrigin.y),t}writeProjectionSphere(e,t=new Float64Array(4)){let n=this.getPage(e),i=.5*Math.hypot(n.maxX-n.minX,n.maxY-n.minY),r=.5*Math.abs(this.verticalFactor)*(n.hMax-n.hMin);return t[0]=(n.minX+n.maxX)*.5-this.worldOrigin.x,t[1]=this.sourceHeightToScene((n.hMin+n.hMax)*.5),t[2]=-((n.minY+n.maxY)*.5-this.worldOrigin.y),t[3]=Math.hypot(i,r),t}}});function Gh(s=9){if(!(Number.isInteger(s)&&s>=1&&s<=16))throw new RangeError("bindingCount must be an integer from 1 to 16");let e=Array.from({length:s-1},(a,o)=>`uniform sampler2D uPageMap${o+1};`).join(`
                `),t=Array.from({length:s},(a,o)=>`uniform vec2 uPageOrigin${o};`).join(`
                `),n=Array.from({length:s},(a,o)=>`uniform float uPageValid${o};`).join(`
                `),i=`vec2 pageGradientUv = sourceXY / uPageSize;
                    vec2 pageGradientDx = dFdx(pageGradientUv);
                    vec2 pageGradientDy = dFdy(pageGradientUv);`,r=Array.from({length:s},(a,o)=>`${o===0?"if":"else if"} (uPageValid${o} > 0.5 &&
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
                uniform vec2 uSourceOrigin;`,samplingBranches:`${i}
                    ${r}`})}var Vh=tt(()=>{});function Wh(s,{capOverscan:e=1.15}={}){if(!s||typeof s.offsets!="function"||typeof s.axialToWorld!="function")throw new TypeError("canonical Gosper core is required");let t=s.TILE_LEVEL,n=s.offsets(t),i=1/0,r=1/0,a=-1/0,o=-1/0;for(let l=0;l<=t;l++){let c=t-l,h=Math.pow(7,c),u=c===0?1:e,d=s.levelSize(c)/Math.sqrt(3)*u;for(let p=0;p<n.length/2;p+=h){let[g,x]=s.axialToWorld(n[p*2],n[p*2+1]);i=Math.min(i,g-d),r=Math.min(r,x-d),a=Math.max(a,g+d),o=Math.max(o,x+d)}}return Object.freeze({minOffsetX:i,minOffsetY:r,maxOffsetX:a,maxOffsetY:o})}function Xh(s,e,t){if(![s,e,t?.minOffsetX,t?.minOffsetY,t?.maxOffsetX,t?.maxOffsetY].every(Number.isFinite))throw new TypeError("finite island center and source footprint are required");return Object.freeze({minX:s+t.minOffsetX,minY:e+t.minOffsetY,maxX:s+t.maxOffsetX,maxY:e+t.maxOffsetY})}function Yh(s,e=null){let t=s?.tile_source_footprint_half_m,n=Number(t?.x),i=Number(t?.y);if(!(Number.isFinite(n)&&n>0&&Number.isFinite(i)&&i>0))throw new Error("geometry.tile_source_footprint_half_m needs positive finite x/y");if(s.footprint_semantics!=="conservative_render_coverage")throw new Error("geometry footprint must describe conservative_render_coverage");if(e){let r=Math.max(-e.minOffsetX,e.maxOffsetX),a=Math.max(-e.minOffsetY,e.maxOffsetY);if(n+1e-6<r||i+1e-6<a)throw new Error("manifest geometry footprint does not cover rendered caps")}return Object.freeze({minOffsetX:-n,minOffsetY:-i,maxOffsetX:n,maxOffsetY:i})}var qh=tt(()=>{});function mx(s,{delaysMs:e=$h,jitterRatio:t=.2,random:n=Math.random}={}){let i=Math.max(0,Math.min(e.length-1,s-1)),r=e[i]||0;if(r<=0||t<=0)return r;let a=(n()*2-1)*t;return Math.max(0,Math.round(r*(1+a)))}var $h,Kr,Jr,Zh=tt(()=>{$h=Object.freeze([1e3,4e3,9e3]);Kr=class{constructor({maxAttempts:e=3,delaysMs:t=$h,jitterRatio:n=.2,random:i=Math.random,sleep:r=a=>new Promise(o=>setTimeout(o,a))}={}){this.maxAttempts=e,this.delaysMs=t,this.jitterRatio=n,this.random=i,this.sleep=r,this.entries=new Map}entryFor(e){let t=this.entries.get(e);return t||(t={attempts:0,exhausted:!1,lastError:null},this.entries.set(e,t)),t}reset(e){this.entries.delete(e)}snapshot(e){let t=this.entries.get(e);return t?{...t}:{attempts:0,exhausted:!1,lastError:null}}async run(e,t,{onRetry:n,onExhausted:i}={}){let r=this.entryFor(e);if(r.exhausted)throw r.lastError||new Error(`Retry budget exhausted for ${e}`);for(;r.attempts<this.maxAttempts;){r.attempts++;try{let a=await t({key:e,attempt:r.attempts,maxAttempts:this.maxAttempts});return this.reset(e),a}catch(a){if(r.lastError=a,r.attempts>=this.maxAttempts)throw r.exhausted=!0,i&&i({key:e,attempts:r.attempts,error:a}),a;let o=mx(r.attempts,{delaysMs:this.delaysMs,jitterRatio:this.jitterRatio,random:this.random});n&&n({key:e,attempt:r.attempts+1,attemptsUsed:r.attempts,maxAttempts:this.maxAttempts,delayMs:o,error:a}),await this.sleep(o)}}throw r.exhausted=!0,r.lastError||new Error(`Retry budget exhausted for ${e}`)}},Jr=class{constructor({onSchedule:e}={}){this.pending=new Set,this.onSchedule=e||(()=>{})}schedule(e){return this.pending.has(e)?!1:(this.pending.add(e),this.onSchedule({kind:e,pending:Array.from(this.pending)}),!0)}has(e){return this.pending.has(e)}consume(e){return this.pending.has(e)?(this.pending.delete(e),!0):!1}consumeAll(){let e=Array.from(this.pending);return this.pending.clear(),e}}});var jr,Kh=tt(()=>{jr=class{constructor({timeoutMs:e=3e4,maxTimeouts:t=2,now:n=()=>performance.now()}={}){this.timeoutMs=e,this.maxTimeouts=t,this.now=n,this.jobs=new Map}track(e,t,n={},i=this.now()){let r=this.jobs.get(e);this.jobs.set(e,{id:e,workerIndex:t,startedAt:i,timeouts:r?.timeouts||n.timeouts||0,metadata:n})}complete(e){return this.jobs.delete(e)}requeue(e,t,n=this.now()){let i=this.jobs.get(e);return i?(i.workerIndex=t,i.startedAt=n,{...i}):null}expired(e=this.now()){let t=[];for(let n of this.jobs.values())e-n.startedAt>=this.timeoutMs&&t.push({...n});return t}recordTimeout(e){let t=this.jobs.get(e);return t?(t.timeouts++,{id:e,workerIndex:t.workerIndex,timeouts:t.timeouts,shouldFail:t.timeouts>=this.maxTimeouts,metadata:t.metadata}):null}timeUntilNextDeadline(e=this.now()){if(this.jobs.size===0)return null;let t=1/0;for(let n of this.jobs.values())t=Math.min(t,this.timeoutMs-(e-n.startedAt));return Math.max(0,t)}snapshot(){return Array.from(this.jobs.values()).map(e=>({...e}))}}});var Cx=$a(()=>{Tr();Hc();Wc();Xc();Yc();Jc();nh();oh();kr();La();yh();Eh();Rh();Ih();Uh();kh();Hh();Vh();qh();Zh();Kh();var L_=oo(Pr()),fn=window.GosperCore,gx="./tile_worker.21803cd3bff3.js",eo="v0.10.0-rc5",Vi={MOVING_2D:"MOVING_2D",MOVING_3D:"MOVING_3D",SINTERING:"SINTERING",STATIC:"STATIC"},Qr="manifest:tile_manifest.json",jh="tiles",Qh="textures",xx=1e4,to=class extends Error{constructor(e){super(e),this.name="UnsupportedDeviceError"}},_x={MOVING_2D:16,MOVING_3D:16,SINTERING:1200,STATIC:0},yx=5,eu=200;function ys(s,e){return e()}var vx=32,Mx=.2,za=vx*Mx,pn=5,Sx=50,Ne=ht,Wi=kn,Pt=Object.freeze({mediumEnterPx:96,mediumExitPx:72,highEnterPx:512,highExitPx:384,maxTextureJobs:2,maxUploadsPerFrame:1});function Oa(s,e){if(e==null||e==="")return s;let t=s.includes("?")?"&":"?";return`${s}${t}v=${encodeURIComponent(String(e))}`}function bx(s,e){let t=za,n=s/(Math.sqrt(3)/2*t),i=(e-n*.5*t)/t,r=n,a=i,o=-n-i,l=Math.round(r),c=Math.round(o),h=Math.round(a),u=Math.abs(l-r),d=Math.abs(c-o),p=Math.abs(h-a);return u>d&&u>p?l=-c-h:d>p?c=-l-h:h=-l-c,{q:l,r:h}}var tu=4e3,Ba=6e4,Ex="view-min",nu=!0,wx=.02,Tx=-1e4,Ax=1e4,Rx={"astc-4x4":$s,"astc-6x6":Zs,"astc-8x6":Ks,bc7:Qi,bc1:ji,etc1:Sr,"pvrtc-rgb":qs},ka=class s{constructor(){console.log(`[HEXAGONS] ${eo} \u2014 loading...`),this.container=document.getElementById("canvas-container"),this.scene=new gr,this.scene.background=new Xe(657930),this.camera=new Rt(60,window.innerWidth/window.innerHeight,10,5e4),this.camera.position.set(0,800,0),this.renderer=new ls({antialias:!0,preserveDrawingBuffer:!0}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.setPixelRatio(window.devicePixelRatio),this.container.appendChild(this.renderer.domElement),this.contextRecovery={active:!1,timer:null,wasLoaderHidden:!1},this.controls=new Cr(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=.08,this.controls.screenSpacePanning=!1,this.controls.minDistance=100,this.controls.maxDistance=5e4,this.controls.maxPolarAngle=Math.PI/2.1,this.isUserInteracting=!1,this.isMovingView=!1,this.cameraMotion=new Gr(300),this.controls.addEventListener("start",()=>{this.isUserInteracting=!0,this.notifyCameraMotion(performance.now())}),this.controls.addEventListener("end",()=>{this.isUserInteracting=!1;let t=performance.now();this.isMovingView&&this.cameraMotion.note(t)}),this.controls.addEventListener("change",()=>{vh(this.isUserInteracting)&&this.notifyCameraMotion(performance.now())}),this.renderer.domElement.addEventListener("wheel",()=>{this.notifyCameraMotion(performance.now())},{capture:!0,passive:!0}),this.attachContextRecovery(),this.lastObservedCameraPose=Vr(this.camera,this.controls.target),this.observedCameraPose=new Float64Array(10),this.viewState=new Or(this),this.needsRender=!0,this.lastLODCamPos=new L().copy(this.camera.position),this.settledLodRadii=new Float32Array([2e3,5e3,1e4,25e3,6e4,1e9]),this.movingLevel=3,this.lodRadii=new Float32Array(pn+1),this.computeLodRadii(),this.lodTileMargin=650,window.addEventListener("resize",this.onResize.bind(this));let e=za/Math.sqrt(3);this.hexGeometry=this.createHexGeometry(e),this.tiles=new Map,this.manifest=null,this.loadingTiles=new Set,this.failedTiles=new Set,this.loadQueue=[],this.geometryRebuildQueue=[],this.geometryPlanEpoch=0,this.textureQueue=[],this.textureResultQueue=[],this.textureStates=new Map,this.failedTextures=new Set,this.texturePageGrid=null,this.texturePageResidency=null,this.texturePageVisibilityAdapter=null,this.texturePagePlanStats=null,this.missingPageTexture=this.createMissingPageTexture(),this.visibilityByKey=new Map,this.currentVisibilityContext=null,this.geometryFrontierStats={plannedTiles:0,activeL3:0,excludedL3:0,selectedDetailNodes:0,rebuilds:0},this.activeTextureJobs=0,this.instantiateQueue=[],this.activeWorkerCount=0,this.recentlyUpgradedTextures=[],this.loaderHidden=!1,this.fatalState=null,this.appStartTime=performance.now(),this.materialsToUpdate=new Set,this.gradientMode=1,this.heightFactor=0,this.transSettings={flatThresh:5,riseStart:6,riseEnd:25,curve:1},this.worldOrigin={x:0,y:0},this.floorMode=Ex,this.floorState={locked:!1,provisional:!1,value:0},this.visibilityBootstrapReady=!1,this.globalStats={min:1/0,max:-1/0,avgSum:0,baseSum:0,count:0},this.frustum=new Oi,this.projScreenMatrix=new nt,this.atmosphereSettings={hazeDistance:tu},this.fpsState={frames:0,activeElapsed:0,lastActiveFrame:null},this.fpsEl=document.getElementById("fps-counter"),this.hexCountEl=document.getElementById("hex-count"),this.triCountEl=document.getElementById("tri-count"),this.drawStatsEl=document.getElementById("draw-stats"),this.debugSectionEl=document.querySelector('[data-section="debug"]'),this.tileHeightEl=document.getElementById("tile-height"),this.cameraHeightEl=document.getElementById("camera-height"),this.statsUpdateState={lastUpdate:0,interval:500},this.wasMovingView=!1,this.engineState=Vi.STATIC,this._perfViolationCount=0,this._perfStats={},this._texErrorCount=0,this._frameCounter=0,this.failureStats={manifestFailures:0,tileFailures:0,textureFailures:0,recoverableSweepsScheduled:0,recoverableSweepsRun:0,globalErrors:0,unhandledRejections:0,workerTimeouts:0,workerRespawns:0,workerFailedJobs:0,contextLost:0,contextRestored:0,contextRecoveryFailures:0},this.resourceRetries=new Kr,this.recoverableResweeps=new Jr({onSchedule:()=>{this.failureStats.recoverableSweepsScheduled++}}),this.failedWorkerJobs=new Set,this.frametimeCanvas=document.getElementById("frametime-graph"),this.frametimeCtx=this.frametimeCanvas?this.frametimeCanvas.getContext("2d"):null,this.frametimeBuffer=new Array(640).fill(16.67),this.frametimeLastTime=performance.now(),this.lodPaused=!1,this.initDebugConsole(),this.installGlobalBackstop(),this.initMinimizeButton(),this.initCollapsibleSections(),this.initLODSliders(),this.initLodTruthLabels(),this.updateFogAndClip(),this.workers=[],this.nextWorkerIdx=0,this.pendingJobs=new Map,this.jobIdCounter=0,this.workerScriptUrl=gx,this.workerWatchdog=new jr,this.workerWatchdogTimer=null,this.textureSupport=null,this.initWorkers(),this.texStats={count:0,totalTranscodeMs:0,maxTranscodeMs:0,formatKey:null,totalGpuBytes:0,maxTextureSize:this.renderer.capabilities.maxTextureSize,highUploadSize:null,highSourceSize:null,highSkippedTopMips:0},this._textureMilestonesDone=!1,this._updateTexBadge(),this.vramLedger=new ds,this.cacheManager=new fs,this.profiler=new Dr(this),this.initTouchMomentumTracking(),this.initWorld(),this.animate(),window.pistonViewer=this}initTouchMomentumTracking(){let e=this.renderer?.domElement;if(!e)return;this.controls&&this.controls.touches&&(this.controls.touches.TWO=null),this.activeTouches=new Map,this.lastTouchDistance=null,this.lastTouchAngle=null,this.lastTouchMidpointY=null;let t=r=>{r.pointerType==="touch"&&(this.activeTouches.set(r.pointerId,{x:r.clientX,y:r.clientY}),this.activeTouches.size===2&&(this.lastTouchDistance=null,this.lastTouchAngle=null,this.lastTouchMidpointY=null))},n=r=>{r.pointerType==="touch"&&this.activeTouches.has(r.pointerId)&&(this.activeTouches.set(r.pointerId,{x:r.clientX,y:r.clientY}),this.activeTouches.size===2&&(r.cancelable&&r.preventDefault(),this.handleTwoFingerGesture(r)))},i=r=>{r.pointerType==="touch"&&(this.activeTouches.delete(r.pointerId),this.activeTouches.size<2&&(this.lastTouchDistance=null,this.lastTouchAngle=null,this.lastTouchMidpointY=null))};e.addEventListener("pointerdown",t,{passive:!0}),e.addEventListener("pointermove",n,{passive:!1}),e.addEventListener("pointerup",i,{passive:!0}),e.addEventListener("pointercancel",i,{passive:!0}),e.addEventListener("lostpointercapture",i,{passive:!0})}handleTwoFingerGesture(e){let t=Array.from(this.activeTouches.keys());if(t.length!==2)return;let n=t[0],i=t[1],r=this.activeTouches.get(n),a=this.activeTouches.get(i),o=Math.hypot(a.x-r.x,a.y-r.y),l=Math.atan2(a.y-r.y,a.x-r.x),c=(r.x+a.x)/2,h=(r.y+a.y)/2;if(this.lastTouchDistance===void 0||this.lastTouchDistance===null){this.lastTouchDistance=o,this.lastTouchAngle=l,this.lastTouchMidpointY=h;return}let u=o/this.lastTouchDistance,d=l-this.lastTouchAngle;for(;d<-Math.PI;)d+=Math.PI*2;for(;d>Math.PI;)d-=Math.PI*2;let p=h-this.lastTouchMidpointY,g=this.camera,x=this.controls.target,m=!1,f=c/this.renderer.domElement.clientWidth*2-1,b=-(h/this.renderer.domElement.clientHeight)*2+1,_=new vr;_.setFromCamera(new Te(f,b),g);let M=new Ft(new L(0,1,0),-x.y),S=new L;if(_.ray.intersectPlane(M,S)||S.copy(x),u!==1&&isFinite(u)&&Math.abs(u-1)>.001){let R=g.position.distanceTo(x),E=R/u;E=Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,E));let N=R/E;g.position.sub(S).divideScalar(N).add(S),x.sub(S).divideScalar(N).add(S),m=!0}if(d!==0&&isFinite(d)&&Math.abs(d)>.001){let R=this.controls.up||new L(0,1,0),E=new kt().setFromAxisAngle(R,d);g.position.sub(S).applyQuaternion(E).add(S),x.sub(S).applyQuaternion(E).add(S),m=!0}if(p!==0&&isFinite(p)&&Math.abs(p)>.1){let R=Math.PI/this.renderer.domElement.clientHeight,E=p*R,N=new oi().setFromVector3(g.position.clone().sub(x));N.phi-=E;let v=this.controls.minPolarAngle!==void 0?this.controls.minPolarAngle:0,T=this.controls.maxPolarAngle!==void 0?this.controls.maxPolarAngle:Math.PI;N.phi=Math.max(v,Math.min(T,N.phi)),N.makeSafe(),g.position.copy(x).add(new L().setFromSpherical(N)),m=!0}m&&(g.lookAt(x),this.controls.update(),this.needsRender=!0,this.notifyCameraMotion(performance.now())),this.lastTouchDistance=o,this.lastTouchAngle=l,this.lastTouchMidpointY=h}initWorkers(){let e=Math.min(6,Math.max(2,navigator.hardwareConcurrency||4)),t=this.renderer.extensions;this.textureSupport={astc:t.has("WEBGL_compressed_texture_astc"),bptc:t.has("EXT_texture_compression_bptc"),s3tc:t.has("WEBGL_compressed_texture_s3tc"),etc2:t.has("WEBGL_compressed_texture_etc"),etc1:t.has("WEBGL_compressed_texture_etc1"),pvrtc:t.has("WEBGL_compressed_texture_pvrtc")||t.has("WEBKIT_WEBGL_compressed_texture_pvrtc"),maxTextureSize:this.renderer.capabilities.maxTextureSize};for(let n=0;n<e;n++)this.workers.push(this._createWorker(n))}_createWorker(e){let t=new Worker(this.workerScriptUrl);return t.onmessage=n=>this.handleWorkerMessage(n),t.onerror=n=>{console.warn(`[WORKER_ERROR] ${e}: ${n.message||"unknown worker error"}`)},t.postMessage({type:"INIT",data:{support:this.textureSupport}}),t}_restartWorker(e,t){this.workers[e]?.terminate(),this.workers[e]=this._createWorker(e),this.failureStats.workerRespawns++,this.log(`Worker ${e} restarted: ${t}`,"error")}handleWorkerMessage(e){let{id:t,status:n,result:i,error:r}=e.data,a=this.pendingJobs.get(t);a&&(this.pendingJobs.delete(t),this.workerWatchdog.complete(t),n==="success"?a.resolve(i):a.reject(new Error(r)),this._scheduleWorkerWatchdog())}postWorkerJob(e,t,n=[]){return new Promise((i,r)=>{let a=this.jobIdCounter++,o={id:a,type:e,data:t,transferables:n,resolve:i,reject:r,resourceKey:this._workerJobResourceKey(e,t),workerIndex:null};this.pendingJobs.set(a,o);let l=this.nextWorkerIdx;this.nextWorkerIdx=(this.nextWorkerIdx+1)%this.workers.length,this._postPendingWorkerJob(o,l)})}_workerJobResourceKey(e,t){return e==="LOAD_TILE"||e==="BUILD_GEOMETRY"?`${t.yq}_${t.yr}`:e==="LOAD_TEXTURE"?(t.urls||[]).join(","):e}_postPendingWorkerJob(e,t,{scheduleWatchdog:n=!0}={}){e.workerIndex=t,this.workerWatchdog.track(e.id,t,{type:e.type,resourceKey:e.resourceKey}),this.workers[t].postMessage({id:e.id,type:e.type,data:e.data},e.transferables),n&&this._scheduleWorkerWatchdog()}_scheduleWorkerWatchdog(){if(this.workerWatchdogTimer||this.pendingJobs.size===0)return;let e=this.workerWatchdog.timeUntilNextDeadline()??3e4;this.workerWatchdogTimer=setTimeout(()=>this._runWorkerWatchdog(),Math.max(0,e))}_failWorkerJob(e,t){this.pendingJobs.delete(e.id),this.workerWatchdog.complete(e.id),this.failedWorkerJobs.add(`${e.type}:${e.resourceKey}`),this.failureStats.workerFailedJobs++,e.reject(t)}_runWorkerWatchdog(){this.workerWatchdogTimer=null;let e=this.workerWatchdog.expired();if(e.length===0){this._scheduleWorkerWatchdog();return}let t=new Set,n=new Map;for(let i of e){let r=this.pendingJobs.get(i.id);if(!r)continue;let a=this.workerWatchdog.recordTimeout(r.id);a&&(this.failureStats.workerTimeouts++,t.add(r.workerIndex),a.shouldFail&&n.set(r.id,new Error(`${r.type} ${r.resourceKey} timed out twice after ${3e4}ms`)))}for(let i of t)this._restartWorker(i,"watchdog timeout");for(let i of Array.from(this.pendingJobs.values())){if(!t.has(i.workerIndex))continue;let r=n.get(i.id);r?this._failWorkerJob(i,r):this._postPendingWorkerJob(i,i.workerIndex,{scheduleWatchdog:!1})}this._scheduleWorkerWatchdog()}log(e,t="info"){let n=document.getElementById("console-output");if(!n)return;let i=document.createElement("div");i.className=`log-line ${t}`,i.textContent=`[${new Date().toLocaleTimeString()}] ${e}`,n.appendChild(i),n.scrollTop=n.scrollHeight}initDebugConsole(){this.log("PistonViewer Initialized.","success"),this.initCopyLogButton()}initCopyLogButton(){let e=document.getElementById("copy-log-btn"),t=document.getElementById("console-output");if(!e||!t)return;let n=e.textContent||"COPY",i=null;e.addEventListener("click",async()=>{let r=Array.from(t.querySelectorAll(".log-line")).map(o=>o.textContent.trim()).filter(Boolean),a=r.length?r.join(`
`):t.textContent.trim();try{await this.writeClipboardText(a),e.textContent="COPIED",e.classList.add("copied")}catch(o){e.textContent="FAILED",e.classList.remove("copied"),console.warn("[HUD] Failed to copy status log:",o)}i&&clearTimeout(i),i=setTimeout(()=>{e.textContent=n,e.classList.remove("copied")},1200)})}async writeClipboardText(e){if(typeof navigator<"u"&&navigator.clipboard?.writeText){await navigator.clipboard.writeText(e);return}this.execCommandCopyText(e)}execCommandCopyText(e){let t=document.createElement("textarea");t.value=e,t.setAttribute("readonly",""),t.style.position="fixed",t.style.left="-9999px",t.style.top="0",document.body.appendChild(t),t.select();try{if(!document.execCommand("copy"))throw new Error("execCommand copy returned false")}finally{document.body.removeChild(t)}}installGlobalBackstop(){s.globalBackstopInstalled||(s.globalBackstopInstalled=!0,window.addEventListener("error",e=>{(window.pistonViewer||this)._recordGlobalBackstop("error",e.error||e.message)}),window.addEventListener("unhandledrejection",e=>{(window.pistonViewer||this)._recordGlobalBackstop("unhandledrejection",e.reason)}))}_recordGlobalBackstop(e,t){let n=t?.message||String(t||"unknown error");e==="unhandledrejection"?this.failureStats.unhandledRejections++:this.failureStats.globalErrors++,this.log(`Unhandled ${e}: ${n}`,"error"),console.error(`[GLOBAL_${e.toUpperCase()}]`,t)}attachContextRecovery(){let e=this.renderer?.domElement;e&&(e.addEventListener("webglcontextlost",t=>this._onWebGLContextLost(t),!1),e.addEventListener("webglcontextrestored",()=>this._onWebGLContextRestored(),!1))}_onWebGLContextLost(e){e.preventDefault(),!this.contextRecovery.active&&(this.contextRecovery.active=!0,this.contextRecovery.wasLoaderHidden=this.loaderHidden,this.failureStats.contextLost++,this.log("Graphics context lost; waiting for browser restore.","error"),this._showLoadingState("Restoring graphics context.","Waiting for WebGL to recover..."),this.contextRecovery.timer=setTimeout(()=>{this.contextRecovery.active&&(this.failureStats.contextRecoveryFailures++,this._showFatalState("context",new Error("WebGL context was not restored within 10 seconds.")))},xx))}_onWebGLContextRestored(){if(this.contextRecovery.active){this.contextRecovery.timer&&(clearTimeout(this.contextRecovery.timer),this.contextRecovery.timer=null),this.failureStats.contextRestored++,this.log("Graphics context restored; rebuilding GPU resources.","info");try{if(this._reuploadGpuResidentState(),this.contextRecovery.active=!1,this.contextRecovery.wasLoaderHidden){let e=document.getElementById("loader");e&&(e.classList.add("hide"),setTimeout(()=>{e.style.display="none"},600)),this.loaderHidden=!0}else this._showLoadingState(),this.checkInitialLoad()}catch(e){this.failureStats.contextRecoveryFailures++,this._showFatalState("context",e)}}}_markGeometryForReupload(e){if(e){e.index&&(e.index.needsUpdate=!0);for(let t of Object.values(e.attributes||{}))t.needsUpdate=!0;e.instanceMatrix&&(e.instanceMatrix.needsUpdate=!0),e.instanceColor&&(e.instanceColor.needsUpdate=!0)}}_markTextureForReupload(e){e&&(e.needsUpdate=!0)}_reuploadGpuResidentState(){this.renderer.resetState(),this.scene.traverse(e=>{this._markGeometryForReupload(e.geometry);let t=e.material?Array.isArray(e.material)?e.material:[e.material]:[];for(let n of t)if(n){n.needsUpdate=!0;for(let i of Object.values(n))i?.isTexture&&this._markTextureForReupload(i)}}),this._markTextureForReupload(this.missingPageTexture);for(let e of this.textureStates.values())for(let t of e.assets.values())this._markTextureForReupload(t.texture);this.renderer.compile(this.scene,this.camera),this.needsRender=!0}_setLoaderText(e,t,n=""){let i=document.getElementById("loader"),r=i?.querySelector(".main-message"),a=i?.querySelector(".fetching-message"),o=document.getElementById("fatal-detail");r&&(r.textContent=e),a&&(a.textContent=t),o&&(o.textContent=n,o.hidden=!n)}_showLoader(){let e=document.getElementById("loader");e&&(e.style.display="flex",e.classList.remove("hide"),this.loaderHidden=!1)}_showLoadingState(e="Good code loads fast.",t="Fetching high-res bestagons..."){this._showLoader();let n=document.getElementById("loader"),i=document.getElementById("fatal-retry-btn");n?.classList.remove("fatal"),i&&(i.hidden=!0),this._setLoaderText(e,t)}_showFatalState(e,t){this.fatalState={kind:e,message:t?.message||String(t)},this._showLoader();let n=document.getElementById("loader"),i=document.getElementById("fatal-retry-btn");n?.classList.add("fatal"),i&&(i.hidden=!1,i.onclick=()=>this.retryInitWorld()),e==="unsupported-device"?this._setLoaderText("This device can't run the viewer.","The graphics hardware is missing a required capability.",this.fatalState.message):e==="manifest"?this._setLoaderText("Could not load the terrain manifest.","Check the asset build or network path, then retry.",this.fatalState.message):e==="context"?this._setLoaderText("Graphics context could not be restored.","Retry after the browser recovers WebGL.",this.fatalState.message):this._setLoaderText("The viewer failed to initialize.","Retry after fixing the reported startup problem.",this.fatalState.message)}_disposeObjectTree(e){if(!e)return;e.parent?.remove(e);let t=new Set;e.traverse(n=>{n.isMesh&&n.geometry?.dispose();let i=n.material?Array.isArray(n.material)?n.material:[n.material]:[];for(let r of i)!r||t.has(r)||(t.add(r),this.materialsToUpdate.delete(r),r.dispose())})}_disposeHorizon(){this._disposeObjectTree(this.horizonMesh),this._disposeObjectTree(this.movingHorizonMesh),this.horizonMesh=null,this.movingHorizonMesh=null,this.horizonIndex=null,this.movingHorizonIndex=null,this.movingHorizonLocalXZ=null,this.movingHorizonChildrenPerTile=0}_disposeTextureAssets(){for(let e of this.textureStates.values()){for(let t of e.assets.values())t.texture?.dispose();e.assets.clear(),e.loading.clear(),e.queued.clear(),e.failed.clear(),e.activeTier=null}}_resetWorldForInitRetry(){for(let e of Array.from(this.tiles.keys()))this.unloadTile(e);this._disposeHorizon(),this._disposeTextureAssets();for(let e of[this.capGeometry,this.unitSkirtGeometry,this.aggregateSkirtGeometry])e?.dispose();this.manifest=null,this.textureContract=null,this.binaryContract={},this.manifestGrid=null,this.texturePageGrid=null,this.texturePageResidency=null,this.texturePageVisibilityAdapter=null,this.textureStates=new Map,this.visibilityByKey.clear(),this.currentVisibilityContext=null,this.geometryPageFootprint=null,this.loadingTiles.clear(),this.failedTiles.clear(),this.failedTextures.clear(),this.loadQueue.length=0,this.geometryRebuildQueue.length=0,this.textureQueue.length=0,this.textureResultQueue.length=0,this.instantiateQueue.length=0,this.recoverableResweeps.consumeAll(),this.resourceRetries.reset(Qr),this.contextRecovery.timer&&(clearTimeout(this.contextRecovery.timer),this.contextRecovery.timer=null),this.contextRecovery.active=!1,this.geometryPlanEpoch++,this.activeTextureJobs=0,this.activeWorkerCount=0,this.vramLedger=new ds,this.cacheManager=new fs,this.appStartTime=performance.now(),this.fatalState=null,this.needsLODUpdate=!0,this.needsRender=!0}retryInitWorld(){this.log("Retrying viewer initialization.","info"),this._resetWorldForInitRetry(),this._showLoadingState(),this.initWorld()}initMinimizeButton(){let e=document.getElementById("minimize-btn"),t=document.getElementById("main-panel");e&&t&&e.addEventListener("click",()=>{t.classList.toggle("minimized"),e.textContent=t.classList.contains("minimized")?"+":"\u2212"})}initCollapsibleSections(){document.querySelectorAll(".collapsible-header").forEach(e=>{e.addEventListener("click",()=>{let t=e.parentElement;t.classList.toggle("collapsed"),t===this.debugSectionEl&&!t.classList.contains("collapsed")&&this.updateRendererDebugStats()})})}initLodTruthLabels(){let e=r=>`${r/1e3}`,t=Array.from(this.settledLodRadii.slice(0,3),e),n=Array.from(this.settledLodRadii.slice(3,5),e),i=fn.levelSize(this.movingLevel);this._setHudText("near-lod-bands",`${t.join(" / ")} km`),this._setHudText("far-lod-bands",`${n.join(" / ")} km`),this._setHudText("moving-lod-summary",`moving: uniform skirtless L${this.movingLevel} (${i.toFixed(0)} m)`),this._setHudText("settled-lod-summary",`settled: fixed ${[...t,...n].join(" / ")} km bands`)}initLODSliders(){let e=document.getElementById("haze-distance-slider"),t=document.getElementById("haze-distance-val");e&&(e.value=this.atmosphereSettings.hazeDistance/1e3,t&&(t.textContent=this.atmosphereSettings.hazeDistance/1e3+"km"),e.addEventListener("input",()=>{this.atmosphereSettings.hazeDistance=parseInt(e.value)*1e3,t&&(t.textContent=e.value+"km"),this.updateFogAndClip()}));let n=document.getElementById("tex-upgrade-slider"),i=document.getElementById("tex-upgrade-val");n&&(n.min="128",n.max="2048",n.step="64",n.value=Pt.highEnterPx,i&&(i.textContent=Pt.highEnterPx+"px"),n.addEventListener("input",()=>{this.highTextureEnterPx=parseInt(n.value,10),i&&(i.textContent=this.highTextureEnterPx+"px"),this.needsLODUpdate=!0,this.needsRender=!0}));let r=document.getElementById("gradient-terrain"),a=document.getElementById("gradient-slope");r&&a&&(r.addEventListener("click",()=>{this.gradientMode=0,r.classList.add("active"),a.classList.remove("active"),r.style.background="#74b9ff",r.style.color="#fff",a.style.background="transparent",a.style.color="#ccc",this.needsRender=!0}),a.addEventListener("click",()=>{this.gradientMode=1,a.classList.add("active"),r.classList.remove("active"),a.style.background="#74b9ff",a.style.color="#fff",r.style.background="transparent",r.style.color="#ccc",this.needsRender=!0}));let o=document.getElementById("lod-pause-toggle");o&&o.addEventListener("change",l=>{bh(this,l.target.checked),this.log(this.lodPaused?"LOD Updates PAUSED":"LOD Updates RESUMED","info")})}computeLodRadii(){this.lodRadii.set(this.settledLodRadii)}updateLevelVisibility(e){for(let t of this.tiles.values())this._applyTileLevelVisibility(t,e)}_applyTileLevelVisibility(e,t){let n=this.camera.position.x,i=this.camera.position.y,r=this.camera.position.z,a=this.lodRadii,o=e.mesh;if(!o)return;let l=Sh(this.isMovingView,e.geometryAwaitingFinal);for(let M of o.children){let S=M.userData.gosperLevel;if(S!==void 0){for(let R of M.children)R.material?.userData&&(R.material.userData.forceMovingMode=l);if(S>=1&&M.children[1]&&(M.children[1].visible=!l),l){let R=S===this.movingLevel;M.visible!==R&&(M.visible=R)}}}if(l)return;let c=((e.stats?.avg??this.floorState.value)-this.floorState.value)*t,h=e.stats?Math.max(Math.abs(e.stats.avg-e.stats.min),Math.abs(e.stats.max-e.stats.avg))*t:0,u=this.visibilityAdapter?.horizontalRadiusByLevel?.[pn]||551,d=Math.max(this.lodTileMargin,Math.hypot(u,h)+16),p=e.lx-n,g=c-i,x=e.lz-r,m=Math.sqrt(p*p+g*g+x*x),f=m-d,b=m+d,_=e.finestBuilt??0;for(let M of o.children){let S=M.userData.gosperLevel;if(S===void 0)continue;let R;if(S>=pn)R=!0;else{let E=S<=_||S<=0?0:a[S-1],N=a[S];R=f<N&&b>E}M.visible!==R&&(M.visible=R)}}createHexGeometry(e){let t=new yr(e,6);t.rotateX(-Math.PI/2);let n=t.attributes.position.count;t.setAttribute("aSideId",new St(new Float32Array(n).fill(0),1));let i=r=>{let a=[],o=[],l=[],c=0;for(let u=0;u<r;u++){let d=u*Math.PI/3,p=(u+1)*Math.PI/3,g=Math.cos(d)*e,x=Math.sin(d)*e,m=Math.cos(p)*e,f=Math.sin(p)*e;a.push(g,0,x),a.push(m,0,f),a.push(g,-1,x),a.push(m,-1,f),o.push(c+2,c+1,c+0),o.push(c+2,c+3,c+1);for(let b=0;b<4;b++)l.push(u%3);c+=4}let h=new cn;return h.setAttribute("position",new St(a,3)),h.setAttribute("aSideId",new St(l,1)),h.setIndex(o),h.computeVertexNormals(),h};return{capGeo:t,unitSkirtGeo:i(3),aggregateSkirtGeo:i(6)}}onResize(){this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix(),this.renderer.setSize(window.innerWidth,window.innerHeight),this.needsLODUpdate=!0,this.needsRender=!0}updateFogAndClip(){let e=this.atmosphereSettings.hazeDistance,t=e,n=e*.6;this.isMiniBake?this.scene.fog=null:(this.scene.fog||(this.scene.fog=new mr(657930,n,t)),this.scene.fog.near=n,this.scene.fog.far=t),this.camera.far=Math.max(e+2e3,Ba+5e3),this.camera.updateProjectionMatrix(),this.horizonMesh?.material?.userData?.shader&&this.horizonMesh.material.userData.shader.uniforms.uHazeRange.value.set(e*.8,Ba),this.needsRender=!0}_logRetry(e,t,n){let i=(n.delayMs/1e3).toFixed(1);this.log(`${e} retry ${n.attempt}/${n.maxAttempts} in ${i}s: ${t}`,"error"),console.warn(`[${e.toUpperCase()}_RETRY] ${t}: ${n.error.message}`)}_validateManifestContract(e){if(e.type!=="gosper_l5")throw new Error(`Manifest type '${e.type}' is not gosper_l5 \u2014 re-run the baker`);let t=e.texture_pages,n=new Set(["xuastc-ldr-4x4","xuastc-ldr-6x6","xuastc-ldr-8x6"]);if(!t||t.container!=="ktx2"||!n.has(t.codec))throw new Error("Manifest needs the global XUASTC KTX2 texture-page contract");let i=t.encoding_profile?.tiers||{};if(t.encoding_profile){for(let o of["low","medium","high"])if(i[o]?.codec!==t.codec)throw new Error(`Manifest texture encoding profile is missing ${o} settings`)}else{if(t.codec!=="xuastc-ldr-6x6")throw new Error("Only the migration-era 6x6 manifest may omit encoding-profile settings");console.warn("[HEXAGONS] Legacy 6x6 texture manifest; rebake to record an encoding profile.")}let r={low:128,medium:256,high:4096},a=Object.fromEntries((t.tiers||[]).map(o=>[o.name,o.size_px]));for(let[o,l]of Object.entries(r))if(a[o]!==l)throw new Error(`Manifest texture tier ${o} must be ${l}px`)}async _loadManifestWithRetry(){return this.resourceRetries.run(Qr,async()=>{let e=await fetch(Oa("tile_manifest.json",eo),{cache:"no-store"});if(!e.ok)throw new Error(`Manifest HTTP ${e.status}`);let t=await e.json();return this._validateManifestContract(t),t},{onRetry:e=>this._logRetry("manifest","tile_manifest.json",e),onExhausted:()=>{this.failureStats.manifestFailures++}})}async initWorld(){try{this.manifest=await this._loadManifestWithRetry();let e=this.manifest.texture_pages;this.profiler?.milestone("manifestLoaded"),this.textureContract=e,this.binaryContract=this.manifest.binary||{};let t=new Set(this.binaryContract.supported_versions||[1,2]),n=Math.max(this.manifest.bounds.max_x-this.manifest.bounds.min_x,this.manifest.bounds.max_y-this.manifest.bounds.min_y);this.isMiniBake=n<=3e4;let i=document.getElementById("haze-distance-control");i&&(i.hidden=this.isMiniBake),this.updateFogAndClip();let{min_x:r,min_y:a}=this.manifest.bounds;if(this.worldOrigin={x:r,y:a},this.texturePageGrid=new Yr(e,{expectedCrs:"EPSG:31254"}),this.texturePageGrid.crs!=="EPSG:31254"||this.texturePageGrid.pageSize!==1024)throw new Error("Texture pages must use the EPSG:31254 global 1024m grid");if(this.renderer.capabilities.maxTextures<9)throw new to(`Global texture pages need ${9} fragment samplers; device exposes ${this.renderer.capabilities.maxTextures}`);this.texturePageResidency=new qr({pages:this.texturePageGrid.pages,mini:this.isMiniBake,mediumEnterPx:Pt.mediumEnterPx,mediumExitPx:Pt.mediumExitPx,highEnterPx:Pt.highEnterPx}),this.textureStates=this.texturePageResidency.states,this.texturePageVisibilityAdapter=new Zr({pages:this.texturePageGrid.pages,worldOrigin:this.worldOrigin}),this.geometryPageFootprint=Yh(this.manifest.geometry,Wh(fn,{capOverscan:Ia})),this.manifestGrid=new Map;for(let p of this.manifest.tiles){if(p.gspVersion=Number(p.gspVersion??this.binaryContract.default_version??1),!t.has(p.gspVersion))throw new Error(`Manifest tile ${p.yq}_${p.yr} uses unsupported GSP${p.gspVersion}`);p.lx=p.x-this.worldOrigin.x,p.lz=-(p.y-this.worldOrigin.y);let g=`${p.yq}_${p.yr}`;this.manifestGrid.set(g,p);let x=this.texturePageGrid.pagesForBounds(Xh(p.x,p.y,this.geometryPageFootprint),{includeMissing:!0,maxPages:9});p.texturePageKeys=x.map(m=>m.key),this.texturePageResidency.attachConsumer(g,x.filter(m=>m.available).map(m=>m.key))}this.visibilityAdapter=new Hr({manifest:this.manifest,worldOrigin:this.worldOrigin});let o=fn.offsets(pn);this.unitIndexMap=new Map;for(let p=0;p<o.length/2;p++)this.unitIndexMap.set(o[p*2]+128<<8|o[p*2+1]+128,p);let l=[{x:59817.9,y:206666.2},{x:95855.9,y:222423.2}],c=null,h=null;for(let p of l){let g=this.nearestManifestTile(p.x,p.y);if(g&&Math.hypot(g.x-p.x,g.y-p.y)<2e3){c=p.x-this.worldOrigin.x,h=-(p.y-this.worldOrigin.y);break}}if(c===null){let p=(this.manifest.bounds.min_x+this.manifest.bounds.max_x)*.5,g=(this.manifest.bounds.min_y+this.manifest.bounds.max_y)*.5;c=p-this.worldOrigin.x,h=-(g-this.worldOrigin.y)}this.camera.position.set(c,1200,h),this.controls.target.set(c,0,h),this.bootstrapVisibilityFloor(this.controls.target),this.notifyCameraMotion(performance.now()),this.controls.update(),this.syncHeightFactorFromControls(),await this.viewState.restoreFromUrl(),this.bootstrapVisibilityFloor(this.controls.target),this.syncHeightFactorFromControls(),this.visibilityBootstrapReady=!0,this.lastVisibilityCameraPosition=this.camera.position.clone();let u=za/Math.sqrt(3),d=this.createHexGeometry(u);this.capGeometry=d.capGeo,this.unitSkirtGeometry=d.unitSkirtGeo,this.aggregateSkirtGeometry=d.aggregateSkirtGeo,this.essentialTilesTarget=1,this.buildHorizon(),this.updateLOD()}catch(e){console.error("Init error: "+e.message),this.log("Init error: "+e.message,"error");let t=this.resourceRetries.snapshot(Qr);e instanceof to?this._showFatalState("unsupported-device",e):t.exhausted||!this.manifest?this._showFatalState("manifest",e):this._showFatalState("init",e)}}nearestManifestTile(e,t){let n=null,i=1/0;for(let r of this.manifest.tiles){let a=(r.x-e)**2+(r.y-t)**2;a<i&&(i=a,n=r)}return n}bootstrapVisibilityFloor(e=this.controls?.target){if(!this.manifest?.tiles||this.floorState.locked||this.tiles.size>0)return!1;let t=wh(this.manifest.tiles,e);return Number.isFinite(t)?(this.floorState.value=t,this.floorState.provisional=!0,!0):!1}syncHeightFactorFromControls(e=this.controls.getPolarAngle()*180/Math.PI){return this.heightFactor=Math.min(1,Math.max(0,(e-5.5)/(25-5.5))),this.heightFactor}buildHorizon(){let e=this.manifest.tiles;if(!e.length)return;let t=this.capGeometry.clone(),n=e.length,i=new Float32Array(n),r=new Float32Array(n),a=fn.levelXZ(pn);this.horizonIndex=new Map,this._horizonMat4=new nt;let o=new ni({color:16777215});o.fog=!1,o.customProgramCacheKey=()=>"piston_horizon_v1",o.onBeforeCompile=S=>{o.userData.shader=S,S.uniforms.uHeightFactor={value:0},S.uniforms.uFloorOffset={value:0},S.uniforms.uCameraPos={value:new L},S.uniforms.uHazeColor={value:new Xe(657930)},S.uniforms.uHazeRange={value:new Te(tu*.8,Ba)},S.vertexShader=S.vertexShader.replace("#include <common>",`
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
            `)};let l=new ii(t,o,n),c=new nt;e.forEach((S,R)=>{c.set(a.a,0,a.b,S.lx,0,1,0,0,a.c,0,a.d,S.lz,0,0,0,1),l.setMatrixAt(R,c),i[R]=S.hMean;let E=(S.nx-128)/127,N=(S.nz-128)/127,v=Math.sqrt(Math.max(0,1-E*E-N*N));r[R]=Math.max(0,E*-.35+v*.85+N*-.4),this.horizonIndex.set(`${S.yq}_${S.yr}`,R)}),t.setAttribute("instanceH",new mt(i,1)),t.setAttribute("instanceShade",new mt(r,1)),l.frustumCulled=!1,l.instanceMatrix.needsUpdate=!0,l.userData.gosperLevel=pn,l.userData.isSettledHorizon=!0,this.horizonMesh=l,this.materialsToUpdate.add(o),o.userData.isHorizon=!0,this.scene.add(l);let h=this.movingLevel,u=Math.pow(7,pn-h),d=Math.pow(7,h),p=fn.offsets(pn),g=[];for(let S=0;S<u;S++){let R=S*d,E=p[R*2],N=p[R*2+1],[v,T]=fn.axialToWorld(E,N);g.push({x:v,z:-T})}this.movingHorizonLocalXZ=g,this.movingHorizonChildrenPerTile=u,this.movingHorizonIndex=new Map;let x=n*u,m=this.capGeometry.clone(),f=new Float32Array(x),b=new Float32Array(x),_=new ii(m,o,x),M=0;e.forEach(S=>{this.movingHorizonIndex.set(`${S.yq}_${S.yr}`,M);for(let R=0;R<u;R++,M++)this._writeMovingHorizonMatrix(_,M,S,R,!1),f[M]=S.hMean,b[M]=r[this.horizonIndex.get(`${S.yq}_${S.yr}`)]}),m.setAttribute("instanceH",new mt(f,1)),m.setAttribute("instanceShade",new mt(b,1)),_.frustumCulled=!1,_.instanceMatrix.setUsage(Ac),_.instanceMatrix.needsUpdate=!0,_.visible=!1,_.userData.gosperLevel=h,_.userData.isMovingHorizon=!0,this.movingHorizonMesh=_,this.scene.add(_)}_writeMovingHorizonMatrix(e,t,n,i,r){let a=this._horizonMat4;if(r)a.makeScale(0,0,0);else{let o=fn.levelXZ(this.movingLevel),l=this.movingHorizonLocalXZ[i];a.set(o.a,0,o.b,n.lx+l.x,0,1,0,0,o.c,0,o.d,n.lz+l.z,0,0,0,1)}e.setMatrixAt(t,a)}setHorizonTileHidden(e,t){if(!this.horizonMesh||!this.horizonIndex?.has(e))return;let n=this.horizonIndex.get(e),i=this.manifestGrid.get(e),r=this._horizonMat4;if(t)r.makeScale(0,0,0);else{let a=fn.levelXZ(pn);r.set(a.a,0,a.b,i.lx,0,1,0,0,a.c,0,a.d,i.lz,0,0,0,1)}if(this.horizonMesh.setMatrixAt(n,r),this.horizonMesh.instanceMatrix.needsUpdate=!0,this.movingHorizonMesh&&this.movingHorizonIndex?.has(e)){let a=this.movingHorizonIndex.get(e);for(let o=0;o<this.movingHorizonChildrenPerTile;o++)this._writeMovingHorizonMatrix(this.movingHorizonMesh,a+o,i,o,t);this.movingHorizonMesh.instanceMatrix.needsUpdate=!0}}createMissingPageTexture(){let e=new Uint8Array([255,0,255,255]),t=new xr(e,1,1,Ot);return t.minFilter=ot,t.magFilter=ot,t.generateMipmaps=!1,t.colorSpace=at,t.needsUpdate=!0,t.userData.isMissingTexturePage=!0,t}createTileMaterial(e){let t=new ni({map:this.missingPageTexture,side:jt});return t.userData||(t.userData={}),t.userData.isClone=!0,t.userData.lodIdx=e,this.setupMaterialShader(t),t}createMeshFromWorkerData(e,t,n=!0){if(!e||e.matrix.length===0)return null;let i=e.matrix.length/16,r=this.capGeometry.clone(),a=e.level>=1?this.aggregateSkirtGeometry:this.unitSkirtGeometry,o=n?a.clone():null,l=new ii(r,t,i),c=o?new ii(o,t,i):null;l.frustumCulled=!1,c&&(c.frustumCulled=!1),l.instanceMatrix=new mt(e.matrix,16),c&&(c.instanceMatrix=new mt(e.matrix,16));let h=[l];c&&h.push(c),h.forEach(d=>{d.geometry.setAttribute("instanceNZ_1",new mt(e.nz1,4)),d.geometry.setAttribute("instanceNZ_2",new mt(e.nz2,4)),d.geometry.setAttribute("instanceSlopes",new mt(e.slopes,3)),d.geometry.setAttribute("instanceDeltas",new mt(e.deltas,3)),d.geometry.setAttribute("instanceNormal",new mt(e.norms,2)),d.geometry.setAttribute("aParentPos",new mt(e.parentPos,2)),d.geometry.setAttribute("aParentHeight",new mt(e.parentHeight,1))});let u=new en;return u.add(l),c&&u.add(c),u.userData.activeSkirts=c?e.activeSkirts:0,u.frustumCulled=!1,u}setupMaterialShader(e){e.customProgramCacheKey=()=>"piston_hex_global_pages_v4";let t=this.texturePageGrid.pageSize,n=this.worldOrigin,i=this.missingPageTexture,r=`
                #ifdef USE_MAP
                    // The fragment shader computes absolute source-grid UVs.
                    // A stable placeholder keeps Three's USE_MAP variant live.
                    vMapUv = vec2(0.5);
                #endif
                #include <project_vertex>
            `,a=Gh(9),o=a.declarations,c=`
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
            `;e.onBeforeCompile=function(h){this.userData.shader=h,h.uniforms.uHeightFactor={value:0},h.uniforms.uGradientMode={value:1},h.uniforms.uFloorOffset={value:0},h.uniforms.uCameraPos={value:new L},h.uniforms.uLodRadii={value:new Te(0,1e9)},h.uniforms.uFinestBuilt={value:0};let u=this.userData.texturePageBindings||[];h.uniforms.uPageSize={value:t},h.uniforms.uSourceOrigin={value:new Te(n.x,n.y)};for(let d=0;d<9;d++){let p=u[d]||{};d>0&&(h.uniforms[`uPageMap${d}`]={value:p.texture||i}),h.uniforms[`uPageOrigin${d}`]={value:new Te(p.page?.minX||0,p.page?.minY||0)},h.uniforms[`uPageValid${d}`]={value:p.valid?1:0}}h.vertexShader=h.vertexShader.replace("#include <common>",`
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
            `).replace("#include <map_fragment>",c)},e.needsUpdate=!0}updateGlobalStats(e){e&&(this.globalStats.min=Math.min(this.globalStats.min,e.min),this.globalStats.max=Math.max(this.globalStats.max,e.max),this.globalStats.avgSum+=e.avg,this.globalStats.baseSum+=e.base,this.globalStats.count++)}formatHudNumber(e){return Number.isFinite(e)?Math.round(e).toLocaleString():"--"}updateRendererDebugStats(){if(!this.debugSectionEl||this.debugSectionEl.classList.contains("collapsed"))return;let e=this.renderer?.info?.render||{},t=this.renderer?.info?.memory||{};this.triCountEl&&(this.triCountEl.textContent=this.formatHudNumber(e.triangles)),this.drawStatsEl&&(this.drawStatsEl.textContent=`Calls: ${this.formatHudNumber(e.calls)} | G:${this.formatHudNumber(t.geometries)} | T:${this.formatHudNumber(t.textures)}`)}updateRenderStats(e){if(e-this.statsUpdateState.lastUpdate<500)return;this.statsUpdateState.lastUpdate=e,this.updateRendererDebugStats();let t=0,n=0;for(let r of this.tiles.values())r.mesh&&r.mesh.isGroup&&r.mesh.children.forEach(a=>{if(a.isGroup&&a.visible){let o=a.children[0],l=a.children[1];o&&o.visible&&(t+=o.count),l&&l.visible&&(n+=a.userData.activeSkirts||0)}});let i=document.getElementById("hex-count");i&&(i.innerHTML=`
                <span style="color: #00d2ff">${t.toLocaleString()} TOPS</span> | 
                <span style="color: #ff7675">${n.toLocaleString()} SKIRTS</span>
            `)}updateFps(e,t){if(!this.fpsEl)return;let n=this.camera.position.distanceTo(this.controls.target);if(!t&&this.engineState===Vi.STATIC){this.fpsEl.textContent=`FPS: IDLE | Zoom: ${n.toFixed(0)}`,this.fpsState.frames=0,this.fpsState.activeElapsed=0,this.fpsState.lastActiveFrame=null;return}if(!t||(this.fpsState.lastActiveFrame!==null&&(this.fpsState.activeElapsed+=Math.max(0,e-this.fpsState.lastActiveFrame)),this.fpsState.lastActiveFrame=e,this.fpsState.frames+=1,this.fpsState.activeElapsed<500||this.fpsState.frames<2))return;let i=(this.fpsState.frames-1)*1e3/this.fpsState.activeElapsed;this.fpsEl.textContent=`FPS: ${i.toFixed(0)} | Zoom: ${n.toFixed(0)}`,this.fpsState.frames=1,this.fpsState.activeElapsed=0,this.fpsState.lastActiveFrame=e}updateFrametimeGraph(){if(!this.frametimeCtx)return;let e=performance.now(),t=e-this.frametimeLastTime;this.frametimeLastTime=e,this.frametimeBuffer.shift(),this.frametimeBuffer.push(t);let n=this.frametimeCtx,i=this.frametimeCanvas.width,r=this.frametimeCanvas.height;n.fillStyle="#0a0a0a",n.fillRect(0,0,i,r),n.strokeStyle="#222",n.lineWidth=1;let a=r-16.67/50*r;n.beginPath(),n.moveTo(0,a),n.lineTo(i,a),n.stroke();let o=r-33.33/50*r;n.beginPath(),n.moveTo(0,o),n.lineTo(i,o),n.stroke(),n.strokeStyle="#74b9ff",n.lineWidth=2,n.beginPath();for(let l=0;l<this.frametimeBuffer.length;l++){let c=Math.min(this.frametimeBuffer[l],50),h=l,u=r-c/50*r;l===0?n.moveTo(h,u):n.lineTo(h,u)}n.stroke(),n.fillStyle="#666",n.font="10px monospace",n.fillText("16.67ms (60fps)",5,a-3),n.fillText("33.33ms (30fps)",5,o-3)}_textureResourceKey(e){return typeof e=="string"?e:e?.key}_textureState(e){let t=this._textureResourceKey(e),n=this.texturePageResidency?.state(t);if(!n)throw new Error(`Unknown texture page ${t}`);return n}_textureUrls(e,t){let n=e===Ne.LOW?"low":e===Ne.MEDIUM?"medium":"high",i=this.texturePageGrid.urlFor(t,n);if(!i)throw new Error(`Texture page ${t} has no ${n} asset`);return[Oa(i,this.textureContract.cache_key)]}_textureFailureKey(e,t){return`${e}|${t}`}_markTileFailed(e,t){this.failedTiles.has(e)||this.failureStats.tileFailures++,this.failedTiles.add(e),this.recoverableResweeps.schedule(jh),this.log(`Terrain tile failed: ${e} (${t.message})`,"error")}_markTextureFailed(e,t,n){let i=this._textureFailureKey(e,t);this.failedTextures.has(i)||this.failureStats.textureFailures++,this.failedTextures.add(i),this.recoverableResweeps.schedule(Qh),this.log(`Texture page failed: ${e}/${t} (${n.message})`,"error")}_runRecoverableResweep(){let e=this.recoverableResweeps.consumeAll();if(e.length===0)return;let t=0,n=0;if(e.includes(jh)){for(let i of this.failedTiles)this.resourceRetries.reset(`tile:${i}`),t++;this.failedTiles.clear()}if(e.includes(Qh)){for(let i of this.failedTextures){let[r,a]=i.split("|"),o=this.textureStates.get(r);o&&o.failed.delete(a),this.resourceRetries.reset(`texture:${i}`),n++}this.failedTextures.clear()}this.failureStats.recoverableSweepsRun++,this.needsLODUpdate=!0,this.needsRender=!0,this.log(`Retrying failed resources after camera settled (${t} tiles, ${n} textures).`,"info")}_desiredTextureTier(e,t,n){if(n==="outside")return Ne.LOW;let i=e.desiredTier||Ne.LOW,r=this.highTextureEnterPx||Pt.highEnterPx,a=r*.75;return n==="visible"&&(i===Ne.HIGH&&t>=a||t>=r)?Ne.HIGH:i!==Ne.LOW&&t>=Pt.mediumExitPx||t>=Pt.mediumEnterPx?Ne.MEDIUM:Ne.LOW}_queueTextureTier(e,t,n=0){if(!e)return;let i=this._textureState(e);if(!(i.assets.has(t)||i.loading.has(t))){if(i.queued.has(t)){let r=this.textureQueue.find(a=>a.key===i.key&&a.tier===t);r&&(r.priority=Math.max(r.priority,n));return}i.failed.has(t)||(i.queued.add(t),this.textureQueue.push({key:i.key,textureResource:e,tier:t,priority:n,urls:this._textureUrls(t,i.key)}))}}_scheduleTextureQuality(e,t,n,i=0,r=!1){let a=this._textureState(e);r||(a.classification=t,a.projectedDiameterPx=n,a.perceptibility=Number.isFinite(i)?i:0,a.desiredTier=this._desiredTextureTier(a,n,t)),this.cacheManager.updatePriority(a.key,a.perceptibility),this._queueTextureTier(e,Ne.LOW,i+1e3),Wi[a.desiredTier]>=Wi[Ne.MEDIUM]&&this._queueTextureTier(e,Ne.MEDIUM,i+500),a.desiredTier===Ne.HIGH&&!this.isMovingView&&this._queueTextureTier(e,Ne.HIGH,i),this._reconcileTextureState(a)}_bestTextureAsset(e,t=e.desiredTier,n=null){return this.texturePageResidency.bestAsset(e,t,n)}_texturePageSlots(e){if((e||[]).length>9)throw new RangeError(`geometry intersects ${e.length} pages; maximum is ${9}`);return(e||[]).map(t=>{let n=this.texturePageGrid.pageByKey.get(t);if(n)return n;let[i,r]=String(t).split("_").map(Number);return this.texturePageGrid.cell(i,r)})}_textureLedgerLocation(e){let t=(e.minX+e.maxX)*.5,n=(e.minY+e.maxY)*.5,i=(e.renderMin-this.floorState.value)*this.heightFactor,r=(e.renderMax-this.floorState.value)*this.heightFactor;return{kind:"texture-page",pageX:e.pageX,pageY:e.pageY,lx:t-this.worldOrigin.x,lz:-(n-this.worldOrigin.y),bounds:new Yt(new L(e.minX-this.worldOrigin.x,Math.min(i,r),-(e.maxY-this.worldOrigin.y)),new L(e.maxX-this.worldOrigin.x,Math.max(i,r),-(e.minY-this.worldOrigin.y)))}}_applyTexturePageBindings(e,t){if(!e)return;let n=this._texturePageSlots(t),i=[];for(let a=0;a<9;a++){let o=n[a]||null,l=o?.available?this.texturePageResidency.state(o.key):null,c=l?this._bestTextureAsset(l):null;l&&(l.activeTier=c?.[0]||null),i.push({page:o,texture:c?.[1]?.texture||this.missingPageTexture,valid:!!(o?.available&&c?.[1]?.texture),tier:c?.[0]||null})}e.userData.texturePageBindings=i,e.map=i[0]?.texture||this.missingPageTexture,e.color.setHex(16777215);let r=e.userData.shader;if(r){r.uniforms.map&&(r.uniforms.map.value=e.map);for(let a=0;a<9;a++){let o=i[a];a>0&&(r.uniforms[`uPageMap${a}`].value=o.texture),r.uniforms[`uPageOrigin${a}`].value.set(o.page?.minX||0,o.page?.minY||0),r.uniforms[`uPageValid${a}`].value=o.valid?1:0}}}_refreshTilePageTextures(e){if(!e)return;let t=new Set([e.material,...e.clonedMaterials||[]]);for(let r of t)this._applyTexturePageBindings(r,e.texturePageKeys);let n=e.texturePageKeys.filter(r=>this.texturePageResidency.state(r)),i=n.map(r=>{let a=this.texturePageResidency.state(r);return this._bestTextureAsset(a)?.[0]||null});e.textureTier=i.length>0&&i.every(Boolean)?i.reduce((r,a)=>Wi[a]<Wi[r]?a:r):null,e.isFullTex=i.length>0&&i.every(r=>r===Ne.HIGH);for(let r=0;r<n.length;r++)i[r]===Ne.HIGH&&this.cacheManager.touch(n[r]);this.needsRender=!0}_refreshTexturePageConsumers(e){for(let t of e.consumers){let n=this.tiles.get(t);n&&this._refreshTilePageTextures(n)}}_reconcileTextureState(e){let t=this._bestTextureAsset(e);t&&e.activeTier!==t[0]&&(e.activeTier=t[0],this._refreshTexturePageConsumers(e)),e.desiredTier!==Ne.HIGH&&e.assets.has(Ne.HIGH)&&this._dropTextureTier(e.key,Ne.HIGH),!this.isMiniBake&&e.classification==="outside"&&e.assets.has(Ne.MEDIUM)&&e.assets.has(Ne.LOW)&&this._dropTextureTier(e.key,Ne.MEDIUM)}_dropTextureTier(e,t,n=!1){let i=this.textureStates.get(e),r=i?.assets.get(t);if(!i||!r)return!0;let a=i.activeTier===t?this._bestTextureAsset(i,i.desiredTier,t):null;return this.texturePageResidency.dropAsset(e,t,a,{rebind:l=>this._refreshTexturePageConsumers(l),dispose:l=>l.texture.dispose()})?(this.vramLedger.removeTexture(e,t),t===Ne.HIGH&&!n&&this.cacheManager.removeHigh(e),!0):!1}_installTextureResult(e,t){let n=this._textureState(e.textureResource);n.loading.delete(e.tier),n.queued.delete(e.tier),n.failed.delete(e.tier),this.failedTextures.delete(this._textureFailureKey(n.key,e.tier));let i=this.buildCompressedTexture(t);if(e.tier===Ne.HIGH){if(!this.cacheManager.admitHigh(n.key,t.gpuBytes||0,o=>this._dropTextureTier(o,Ne.HIGH,!0),new Set(n.classification==="visible"?[n.key]:[]),n.perceptibility,o=>{let l=this.textureStates.get(o);return!!l&&(l.activeTier!==Ne.HIGH||!!this._bestTextureAsset(l,l.desiredTier,Ne.HIGH))})){i.dispose(),n.desiredTier=Ne.MEDIUM,this._reconcileTextureState(n);return}this.texStats.highUploadSize=t.width,this.texStats.highSourceSize=t.sourceWidth||t.width,this.texStats.highSkippedTopMips=t.skippedTopMips||0}let r={texture:i,bytes:t.gpuBytes||0,result:t};this.texturePageResidency.replaceAsset(n.key,e.tier,r,{rebind:a=>this._refreshTexturePageConsumers(a),dispose:a=>a.texture.dispose()}),this.vramLedger.setTexture(n.key,e.tier,t.gpuBytes||0,this._textureLedgerLocation(e.textureResource)),this._reconcileTextureState(n),this.updateTexStats(t),e.tier===Ne.HIGH&&this.recentlyUpgradedTextures.push({q:e.textureResource.pageX,r:e.textureResource.pageY,time:performance.now()})}processTextureResults(){let e=0;for(;e<Pt.maxUploadsPerFrame;){let t=this.textureResultQueue.findIndex(a=>!this.isMovingView||a.task.tier!==Ne.HIGH);if(t<0)break;let{task:n,result:i}=this.textureResultQueue.splice(t,1)[0],r=this._textureState(n.textureResource);if(n.tier===Ne.HIGH&&r.desiredTier!==Ne.HIGH){r.loading.delete(n.tier),r.queued.delete(n.tier);continue}this._installTextureResult(n,i),e++}}_dispatchTextureJobs(e){for(;this.activeWorkerCount<e&&this.activeTextureJobs<Pt.maxTextureJobs&&this.textureQueue.length>0;){let t=Dh(this.textureQueue,this.textureStates,{isMoving:this.isMovingView,lowCoverageFirst:!0,lowCoverageIncludesOutside:this.isMiniBake});if(t<0)break;let n=this.textureQueue.splice(t,1)[0],i=this._textureState(n.textureResource);if(i.queued.delete(n.tier),!(this.isMiniBake&&n.tier===Ne.MEDIUM)&&Wi[n.tier]>Wi[i.desiredTier]||i.assets.has(n.tier)||i.loading.has(n.tier))continue;i.loading.add(n.tier),this.activeWorkerCount++,this.activeTextureJobs++;let a=`texture:${this._textureFailureKey(n.key,n.tier)}`;this.resourceRetries.run(a,()=>this.postWorkerJob("LOAD_TEXTURE",{urls:n.urls}),{onRetry:o=>this._logRetry("texture",`${n.key}/${n.tier}`,o)}).then(o=>{o.networkBytes&&this.vramLedger.addNetworkPayload(n.key,{bin:0,tex:o.networkBytes}),this.textureResultQueue.push({task:n,result:o}),this.needsRender=!0}).catch(o=>{i.loading.delete(n.tier),i.failed.add(n.tier),this._markTextureFailed(n.key,n.tier,o),this._texErrorCount++,this._updateTexBadge(),this._texErrorCount<=3&&console.warn(`[TEX_FAIL] ${n.key}/${n.tier}: ${o.message}`)}).finally(()=>{this.activeWorkerCount--,this.activeTextureJobs--,this.processQueues()})}}_seedMiniTexturePins(){if(!this.isMiniBake||this.miniTexturePinsSeeded||!this.manifest)return;this.miniTexturePinsSeeded=!0;let e=this.texturePageGrid.pages;for(let t of e)this._queueTextureTier(t,Ne.LOW,-1e3);for(let t of e)this._queueTextureTier(t,Ne.MEDIUM,-2e3)}_planTileGeometry(e,{coarseOnly:t=!1}={}){let n=this.currentVisibilityContext;if(!n)throw new Error("geometry selection requires a current visibility context");let i=`${e.yq}_${e.yr}`,r=this.visibilityAdapter.getRootHandle(i);if(r===null)throw new Error(`missing visibility root for ${i}`);let a=Math.max(0,e.hMax-e.hMin),o=this.visibilityAdapter.horizontalRadiusByLevel[3],l=Math.max(this.lodTileMargin,Math.hypot(o,a)+24);return _h({adapter:this.visibilityAdapter,rootHandle:r,visibleFrustum:n.visibleFrustum,guardFrustum:n.guardFrustum,projection:n.projection,detailDistanceByDepth:[1/0,1/0,1/0,t?-1e30:this.settledLodRadii[2],t?-1e30:this.settledLodRadii[1],t?-1e30:this.settledLodRadii[0]],detailMarginMeters:l})}_updateTexturePageDemand({visibleFrustum:e,guardFrustum:t,projection:n}){let i=this.texturePageVisibilityAdapter,r=this.texturePageResidency;if(!i||!r)return;i.setVerticalTransform({factor:this.heightFactor,floor:this.floorState.value});let a=ms({hierarchy:i,visibleFrustum:e,guardFrustum:t,projection:n,maxDepth:0});this.texturePagePlanStats=a.stats,r.beginDemandPass();let o=(l,c)=>{for(let h=0;h<l.nodeIds.length;h++){let u=i.getPage(l.nodeIds[h]),d=l.projectedDiameterPx[h]||0,p=l.distanceMeters[h],g=l.viewDepthMeters[h],x=Number.isFinite(p)&&p>0?Math.max(0,Math.min(1,g/p)):1,m=Math.pow(x,8),f=Number.isFinite(d)?d*(.1+.9*m)*100:999999,b=(c==="visible"?1e9:c==="guard"?1e6:0)+Math.min(999999,f)-Math.min(99999,Number.isFinite(p)?p:99999);r.contribute(u,{classification:c,projectedDiameterPx:d,perceptibility:b})}};o(a.outside,"outside"),o(a.guard,"guard"),o(a.visible,"visible"),r.finishDemandPass({highEnterPx:this.highTextureEnterPx||Pt.highEnterPx}),this.textureQueue=Lh(this.textureQueue,r.states,{includeOutside:this.isMiniBake});for(let l of r.states.values()){if(l.assets.size>0&&this.vramLedger.updateTextureLocation(l.key,this._textureLedgerLocation(l.page)),!$r(l,{includeOutside:this.isMiniBake})){this.cacheManager.updatePriority(l.key,0),this._reconcileTextureState(l);continue}this._scheduleTextureQuality(l.page,l.classification,l.projectedDiameterPx,l.perceptibility,!0)}}updateLOD(){if(!this.visibilityAdapter||!this.visibilityBootstrapReady||this.lodPaused)return;this.camera.updateMatrixWorld(),this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);let e=lh(this.projScreenMatrix),t=this.lastVisibilityCameraPosition||this.camera.position,n=[(this.camera.position.x-t.x)*4,(this.camera.position.y-t.y)*4,(this.camera.position.z-t.z)*4],i=Math.max(300,Math.min(5e3,Math.abs(this.camera.position.y)*.25)),r=ch(e,{marginMeters:i,predictedTranslation:n}),a=new L;this.camera.getWorldDirection(a);let o=new Te;this.renderer.getDrawingBufferSize(o);let l=hh({position:[this.camera.position.x,this.camera.position.y,this.camera.position.z],forward:[a.x,a.y,a.z],verticalFovRadians:Er.degToRad(this.camera.fov),viewportHeightPx:o.y,near:this.camera.near});this.visibilityAdapter.setVerticalTransform({factor:this.heightFactor,floor:this.floorState.value}),this.currentVisibilityContext=Object.freeze({visibleFrustum:e,guardFrustum:r,projection:l}),this._updateTexturePageDemand({visibleFrustum:e,guardFrustum:r,projection:l});let c=ms({hierarchy:this.visibilityAdapter,visibleFrustum:e,guardFrustum:r,projection:l,maxDepth:0}),h=this.visibilityAdapter.summarizePlanByIsland(c);this.visibilityPlanStats={...c.stats,guardMarginMeters:i,viewportWidthPx:o.x,viewportHeightPx:o.y},this.lastVisibilityCameraPosition?this.lastVisibilityCameraPosition.copy(this.camera.position):this.lastVisibilityCameraPosition=this.camera.position.clone(),this.visibilityByKey.clear();let u=this.geometryFrontierStats?.rebuilds||0;this.geometryFrontierStats={plannedTiles:0,activeL3:0,excludedL3:0,selectedDetailNodes:0,rebuilds:u};for(let d=0;d<this.visibilityAdapter.islandCount;d++){let p=this.visibilityAdapter.getIslandKey(d),g=this.manifestGrid.get(p);if(!g)continue;let x=h.classification[d],m=x===un.VISIBLE?"visible":x===un.GUARD?"guard":"outside",f=h.projectedDiameterPx[d]||0,b=h.distanceMeters[d],_=h.viewDepthMeters[d],M=Number.isFinite(b)&&b>0?Math.max(0,Math.min(1,_/b)):1,S=Math.pow(M,8),R=Number.isFinite(f)?f*(.1+.9*S)*100:999999,E=(m==="visible"?1e9:m==="guard"?1e6:0)+Math.min(999999,R)-Math.min(99999,Number.isFinite(b)?b:99999),N={classification:m,projectedDiameterPx:f,distanceMeters:b,viewDepthMeters:_,centerWeight:S,priority:E};this.visibilityByKey.set(p,N);let v=this.tiles.get(p);if(v?.binaryVersion>=2&&m!=="outside"&&!this.isMovingView){let T=this._planTileGeometry(g);v.geometryDesiredSelection=T,v.geometryDesiredSignature=T.signature,this.geometryFrontierStats.plannedTiles++,this.geometryFrontierStats.activeL3+=T.activeL3Count,this.geometryFrontierStats.excludedL3+=T.excludedL3Count,this.geometryFrontierStats.selectedDetailNodes+=T.detailNodeCount,xh(v.geometrySelection,T)?(v.geometryAwaitingFinal=!0,this._queueGeometryRebuild(v,g,T,E)&&this.geometryFrontierStats.rebuilds++):v.geometryAwaitingFinal&&(v.geometryAwaitingFinal=!1,this.needsRender=!0)}m!=="outside"?!this.tiles.has(p)&&!this.loadingTiles.has(p)&&!this.failedTiles.has(p)&&(this.loadingTiles.add(p),this.loadQueue.push({t:g,priority:E})):this.tiles.has(p)&&this.unloadTile(p)}this._seedMiniTexturePins(),this.processQueues(),this.checkInitialLoad()}checkInitialLoad(e){if(this.loaderHidden||this.contextRecovery.active)return;let t=0;for(let n of this.tiles.values())n.mesh&&t++;t>=1&&(this.profiler?.milestone("firstTileOperational"),this.hideLoader())}_suppressHighTextureWorkForMotion(){this.textureQueue=this.textureQueue.filter(e=>e.tier!==Ne.HIGH?!0:(this.textureStates.get(e.key)?.queued.delete(Ne.HIGH),!1));for(let e of this.textureStates.values())e.queued.delete(Ne.HIGH)}notifyCameraMotion(e=performance.now()){let t=this.cameraMotion.enterMotion(e,this.isMovingView);return this.needsRender=!0,this.needsLODUpdate=!0,t?(this.isMovingView=!0,this._beginGeometryMode(!0),this._suppressHighTextureWorkForMotion(),!0):!1}_beginGeometryMode(e){this.geometryPlanEpoch++,this.geometryRebuildQueue.length=0;for(let t of this.tiles.values())t.geometryRebuildQueued=null,t.geometryRebuildNext=null,t.geometryDesiredSelection=null,t.geometryDesiredSignature=null,t.geometryAwaitingFinal=!e&&t.binaryVersion>=2;e&&(this.needsRender=!0)}_queueGeometryRebuild(e,t,n,i){let r={tile:e,manifestTile:t,selection:n,priority:i,epoch:this.geometryPlanEpoch,mode:this.isMovingView?"moving":"settled",signature:n.signature};if(e.geometryDesiredSelection=n,e.geometryDesiredSignature=n.signature,e.geometryRebuildPending){let a=e.geometryRebuildPending;return a.epoch===r.epoch&&a.mode===r.mode&&a.signature===r.signature?!1:(e.geometryRebuildNext=r,!0)}return e.geometryRebuildQueued?(Object.assign(e.geometryRebuildQueued,r,{priority:Math.max(e.geometryRebuildQueued.priority,i)}),!1):(e.geometryRebuildQueued=r,this.geometryRebuildQueue.push(r),!0)}_startGeometryRebuild(e){let{tile:t,manifestTile:n,selection:i}=e,r=`${n.yq}_${n.yr}`;return t.geometryRebuildQueued=null,this.tiles.get(r)!==t||!(t.geometrySource instanceof ArrayBuffer)||t.geometryRebuildPending||!Wr({taskEpoch:e.epoch,currentEpoch:this.geometryPlanEpoch,taskSignature:e.signature,desiredSignature:t.geometryDesiredSignature,taskMode:e.mode,isMovingView:this.isMovingView})?!1:(t.geometryRebuildPending=e,this.activeWorkerCount++,this.postWorkerJob("BUILD_GEOMETRY",{binBuffer:t.geometrySource,yq:n.yq,yr:n.yr,expectedGspVersion:t.binaryVersion,rangesByDepth:i.rangesByDepth}).then(a=>{if(this.tiles.get(r)===t){if(a.binaryVersion!==t.binaryVersion)throw new Error(`geometry rebuild version mismatch for ${r}`);Wr({taskEpoch:e.epoch,currentEpoch:this.geometryPlanEpoch,taskSignature:e.signature,desiredSignature:t.geometryDesiredSignature,taskMode:e.mode,isMovingView:this.isMovingView})&&this._replaceTileGeometry(t,a.lods,a.geometryBytes,i)}}).catch(a=>{console.error(`Geometry rebuild failed for ${r}`,a)}).finally(()=>{this.activeWorkerCount--,t.geometryRebuildPending===e&&(t.geometryRebuildPending=null);let a=t.geometryRebuildNext;t.geometryRebuildNext=null,a&&Wr({taskEpoch:a.epoch,currentEpoch:this.geometryPlanEpoch,taskSignature:a.signature,desiredSignature:t.geometryDesiredSignature,taskMode:a.mode,isMovingView:this.isMovingView})&&(t.geometryRebuildQueued=a,this.geometryRebuildQueue.push(a)),this.needsLODUpdate=!0,this.needsRender=!0,this.processQueues()}),!0)}_replaceTileGeometry(e,t,n,i){let r=new en,a={},o=[],l=Da(this.isMovingView,e.binaryVersion);try{for(let g of l){let x=t[g];if(!x)continue;let m=e.material.clone();m.userData={...e.material.userData,lodIdx:g,shader:null},this.setupMaterialShader(m),this.materialsToUpdate.add(m),o.push(m);let f=this.createMeshFromWorkerData(x,m,!0);f&&(f.userData.activeSkirts=x.activeSkirts,f.userData.gosperLevel=g,g>=1&&f.children[1]&&(f.children[1].visible=!this.isMovingView),r.add(f),a[g]=!0)}let c=Object.keys(a).map(Number);if(c.length===0)throw new Error("filtered rebuild produced no coarse geometry");let h=Math.min(...c);r.position.copy(e.mesh.position);let u={...e,mesh:r,builtLevels:a,finestBuilt:h,geometrySelection:i,geometryAwaitingFinal:!1};this._markFinestBuilt(u),this.renderer.compile(r,this.camera),this._applyTileLevelVisibility(u,this.heightFactor);let d=e.mesh;e.container.add(r),e.container.remove(d);let p=new Set;d.traverse(g=>{if(!g.isMesh)return;g.geometry?.dispose();let x=Array.isArray(g.material)?g.material:[g.material];for(let m of x)!m||p.has(m)||(p.add(m),m.map&&(m.map=null),this.materialsToUpdate.delete(m),m.dispose())}),e.mesh=r,e.lods=t,e.builtLevels=a,e.finestBuilt=h,e.clonedMaterials=o,e.geometrySelection=i,e.geometryAwaitingFinal=!1,this.vramLedger.registerGeometry(`${e.yq}_${e.yr}`,{geometryBytes:n,q:e.yq,r:e.yr,lx:e.lx,lz:e.lz}),this.needsRender=!0}catch(c){r.traverse(h=>{h.isMesh&&h.geometry?.dispose()});for(let h of o)this.materialsToUpdate.delete(h),h.dispose();throw c}}processQueues(){let e=this.workers.length;for(this.geometryRebuildQueue.sort((t,n)=>n.priority-t.priority),this.loadQueue.sort((t,n)=>(n.priority||0)-(t.priority||0));this.activeWorkerCount<e&&(this.loadQueue.length>0||this.geometryRebuildQueue.length>0);){let t=this.geometryRebuildQueue[0],n=this.loadQueue[0];if(t&&(!n||t.priority>(n.priority||0))){this.geometryRebuildQueue.shift(),this._startGeometryRebuild(t);continue}let i=this.loadQueue.shift(),r=`${i.t.yq}_${i.t.yr}`;if(this.tiles.has(r)||this.visibilityByKey.get(r)?.classification==="outside"){this.loadingTiles.delete(r);continue}this.activeWorkerCount++,this.fetchTileOnWorker(i).then(a=>{this.activeWorkerCount--,a&&this.instantiateQueue.push(a),this.processQueues()})}this.loadQueue.length===0&&this.geometryRebuildQueue.length===0&&this._dispatchTextureJobs(e)}async fetchTileOnWorker(e){let t=`${e.t.yq}_${e.t.yr}`;try{let{t:n}=e,i=Number(n.gspVersion??this.binaryContract.default_version??1),r=this.binaryContract.cache_key??`${this.binaryContract.default_format||"GSP"}${this.binaryContract.default_version||i}`,a=Oa(`tiles_bin/gosper_${n.yq}_${n.yr}.bin`,`${r}-gsp${i}`),o=await this.resourceRetries.run(`tile:${t}`,async()=>{let l=await this.postWorkerJob("LOAD_TILE",{yq:n.yq,yr:n.yr,binUrl:a,expectedGspVersion:i});if(l.binaryVersion!==i)throw new Error(`Binary cache mismatch for ${t}: manifest GSP${i}, parsed GSP${l.binaryVersion}`);return l},{onRetry:l=>this._logRetry("tile",t,l)});if(o.binaryVersion>=2){if(!(o.geometrySource instanceof ArrayBuffer)||!o.visibilityData)throw new Error(`GSP2+ tile ${t} did not provide deferred geometry source/bounds`);this.visibilityAdapter.attachDecodedIsland(t,o.visibilityData);let l=this._planTileGeometry(n,{coarseOnly:this.isMovingView||this.visibilityByKey.get(t)?.classification==="outside"}),c=await this.postWorkerJob("BUILD_GEOMETRY",{binBuffer:o.geometrySource,yq:n.yq,yr:n.yr,expectedGspVersion:i,rangesByDepth:l.rangesByDepth});if(c.binaryVersion!==i)throw new Error(`deferred geometry version mismatch for ${t}`);o.lods=c.lods,o.geometryBytes=c.geometryBytes,o.geometrySelection=l}return{task:e,workerData:o}}catch(n){return console.error("Tile Fetch Error",n),this.visibilityAdapter?.detachDecodedIsland(t),this.loadingTiles.delete(`${e.t.yq}_${e.t.yr}`),this._markTileFailed(t,n),null}}buildCompressedTexture(e){let{mipmaps:t,width:n,height:i,formatKey:r,isSRGB:a}=e,o=Rx[r];if(!o)throw new Error(`Unknown compressed texture formatKey from worker: ${r}`);let l=new _r(t,n,i,o);return l.minFilter=t.length>1?ei:At,l.magFilter=At,l.generateMipmaps=!1,l.flipY=!1,l.colorSpace=a?at:tn,l.needsUpdate=!0,l}updateTexStats(e){this.texStats.count++,this.texStats.totalTranscodeMs+=e.transcodeMs||0,this.texStats.maxTranscodeMs=Math.max(this.texStats.maxTranscodeMs,e.transcodeMs||0),this.texStats.formatKey=e.formatKey,this.texStats.totalGpuBytes+=e.gpuBytes||0,this._updateTexBadge()}_updateTexBadge(){if(!this._texBadgeEl){let o=document.createElement("div");o.id="tex-debug-badge",o.style.cssText=["position:fixed","bottom:max(8px,env(safe-area-inset-bottom))","left:max(8px,env(safe-area-inset-left))","max-width:calc(100vw - 16px)","background:rgba(7,20,34,0.82)","font:10px/1.35 'Courier New',monospace","font-variant-numeric:tabular-nums","padding:5px 7px","border-radius:6px","border:1px solid rgba(151,193,224,0.24)","box-shadow:0 2px 10px rgba(0,0,0,0.2)","z-index:9999","pointer-events:none","white-space:nowrap","display:grid","gap:2px"].join(";");let l=new Map;for(let c of Hn){let h=document.createElement("div");h.className="tex-debug-row",h.dataset.tier=c.tier,h.dataset.sizePx=String(c.size),h.style.cssText=["display:grid","grid-template-columns:7px 68px auto","align-items:center","column-gap:5px"].join(";");let u=document.createElement("span");u.dataset.role="tier-swatch",u.style.cssText=["display:block","width:6px","height:6px","border-radius:50%",`background:${c.color}`,`box-shadow:0 0 5px ${c.color}`].join(";");let d=document.createElement("span");d.dataset.role="tier-label",d.style.cssText=`color:${c.color};font-weight:700`,d.textContent=`${c.label} ${c.size}px`;let p=document.createElement("span");p.dataset.role="tier-metrics",p.style.color="#d7e6f2",h.append(u,d,p),o.appendChild(h),l.set(c.tier,{row:h,metrics:p})}document.body.appendChild(o),this._texBadgeEl=o,this._texBadgeRows=l}let e=Oh(this.tiles,this.visibilityByKey),t=Hn.some(({tier:o})=>e[o].size>0);if(!this._textureMilestonesDone&&t){this.profiler?.milestone("firstTexture"),(this.loadQueue?.length??0)===0&&(this.instantiateQueue?.length??0)===0&&Bh(this.tiles,this.visibilityByKey)===0&&this.profiler?.milestone("visibleTexturedCoverage");let l=this.profiler?.milestones||{};this._textureMilestonesDone=l.firstTexture!==void 0&&l.visibleTexturedCoverage!==void 0}let n=zh(this.textureStates),i=Hn.map(({tier:o})=>({tier:o,displayed:e[o].size,loaded:n.loaded[o],pending:n.pending[o],failed:n.failed[o]})),r=JSON.stringify([this.texStats.formatKey,i]);if(r===this._texBadgeSignature)return;this._texBadgeSignature=r;for(let o of i){let{row:l,metrics:c}=this._texBadgeRows.get(o.tier);l.dataset.displayed=String(o.displayed),l.dataset.loaded=String(o.loaded),l.dataset.pending=String(o.pending),l.dataset.failed=String(o.failed),c.textContent=`displayed ${o.displayed} \xB7 loaded ${o.loaded} \xB7 q/inflight ${o.pending} \xB7 fail ${o.failed}`,c.style.color=o.failed>0?"#ff9c9c":"#d7e6f2"}let a=this.texStats.formatKey||"loading";this._texBadgeEl.dataset.format=a,this._texBadgeEl.title=`Texture pages \xB7 ${a}`,this._texBadgeEl.setAttribute("aria-label",`Texture pages ${a}. ${i.map(o=>`${o.tier}: ${o.displayed} displayed, ${o.loaded} loaded, ${o.pending} queued or inflight, ${o.failed} failed`).join(". ")}`)}processInstantiationQueue(){if(this.instantiateQueue.length===0)return;let e=performance.now();for(;this.instantiateQueue.length>0;){let t=this.instantiateQueue.shift();if(ys("instantiateTile",()=>this.instantiateTile(t.task,t.workerData)),performance.now()-e>2)break}}instantiateTile(e,t){let{t:n}=e,i=`${n.yq}_${n.yr}`;if(!this.tiles.has(i)){if(t.networkBytes&&this.vramLedger.addNetworkPayload(i,t.networkBytes),this.visibilityByKey.get(i)?.classification==="outside"){this.visibilityAdapter?.detachDecodedIsland(i),this.loadingTiles.delete(i);return}try{if(!t.lods)throw new Error(`tile ${i} reached instantiation before deferred geometry was built`);t.visibilityData&&this.visibilityAdapter.attachDecodedIsland(i,t.visibilityData);let r=this.createTileMaterial(0);this._applyTexturePageBindings(r,n.texturePageKeys),this.materialsToUpdate.add(r);let a=new en,o=Da(this.isMovingView,t.binaryVersion),l={};for(let b of o){let _=t.lods[b];if(!_)continue;let M=r.clone();M.userData={...r.userData},M.userData.lodIdx=b,M.userData.shader=null,this.setupMaterialShader(M),this.materialsToUpdate.add(M);let S=this.createMeshFromWorkerData(_,M,!0);S&&(S.userData.activeSkirts=_.activeSkirts,S.userData.gosperLevel=b,b>=1&&S.children[1]&&(S.children[1].visible=!this.isMovingView),a.add(S),l[b]=!0)}let c=Object.keys(l).map(Number);if(c.length===0)throw new Error(`tile ${i} has no selected geometry`);let h=Math.min(...c),u=t.binaryVersion>=2&&this.isMovingView?this._planTileGeometry(n,{coarseOnly:!0}):t.geometrySelection||null;a.position.set(n.lx,0,n.lz);let d=new en;n.mesh=a,d.add(a),this.scene.add(d),this.renderer.compile(d,this.camera),d.visible=!0,this.needsRender=!0;let p=this.visibilityAdapter?.horizontalRadiusByLevel?.[pn]||551,g=new Yt(new L(n.lx-p,Tx,n.lz-p),new L(n.lx+p,Ax,n.lz+p)),x=[];d.traverse(b=>{b.isMesh&&b.material&&x.push(b.material)});let m={yq:n.yq,yr:n.yr,lx:n.lx,lz:n.lz,mesh:a,container:d,material:r,bounds:g,lods:t.lods,builtLevels:l,finestBuilt:h,unitHeights:t.unitHeights,stats:t.stats,center:t.center,binaryVersion:t.binaryVersion,geometrySelection:u,geometryDesiredSelection:null,geometryDesiredSignature:null,geometryRebuildPending:null,geometryRebuildQueued:null,geometryRebuildNext:null,geometryAwaitingFinal:!1,geometrySource:t.geometrySource||null,texturePageKeys:[...n.texturePageKeys],textureTier:null,isFullTex:!1,isTransitioning:!1,clonedMaterials:x};this._markFinestBuilt(m),this.tiles.set(i,m),m.binaryVersion>=2&&(this.needsLODUpdate=!0),this.setHorizonTileHidden(i,!0),this.updateGlobalStats(t.stats);let f=t.geometryBytes||0;this.vramLedger.registerGeometry(i,{geometryBytes:f,q:n.yq,r:n.yr,lx:n.lx,lz:n.lz}),this._refreshTilePageTextures(m),this.loadingTiles.delete(i)}catch(r){console.error("Instantiation Error",i,r),this.loadingTiles.delete(i),this.visibilityAdapter?.detachDecodedIsland(i)}}}_markFinestBuilt(e){e.mesh&&e.mesh.traverse(t=>{if(t.isMesh&&t.material?.userData){let n=t.material.userData;n.isFinest=n.lodIdx===e.finestBuilt}})}unloadTile(e){let t=this.tiles.get(e);t&&(this._disposeTileGPU(t),this.vramLedger.deregisterGeometry(e),this.tiles.delete(e),this.loadingTiles.delete(e),this.visibilityAdapter?.detachDecodedIsland(e),this.setHorizonTileHidden(e,!1))}_disposeTileGPU(e){e.container&&this.scene.remove(e.container),e.mesh&&e.mesh.traverse(t=>{if(t.isMesh){t.geometry&&t.geometry.dispose();let n=t.material?Array.isArray(t.material)?t.material:[t.material]:[];for(let i of n)i.map&&(i.map=null),this.materialsToUpdate.delete(i),i.dispose()}}),e.material&&(e.material.map&&(e.material.map=null),this.materialsToUpdate.delete(e.material),e.material.dispose()),e.clonedMaterials&&e.clonedMaterials.forEach(t=>{this.materialsToUpdate.delete(t),t.map&&(t.map=null),t.dispose()}),e.mesh=null,e.material=null,e.clonedMaterials=null,e.container=null,e.lods=null,e.unitHeights=null,e.geometrySource=null,e.geometrySelection=null}hideLoader(){if(this.loaderHidden)return;let e=performance.now()-this.appStartTime;if(e<900){setTimeout(()=>this.hideLoader(),900-e);return}this.loaderHidden=!0,this.profiler?.milestone("loaderHidden"),console.log(`[HEXAGONS] ${eo} \u2014 ready in ${(e/1e3).toFixed(1)}s (${this.tiles.size} tiles)`);let t=document.getElementById("loader");t&&(t.classList.add("hide"),setTimeout(()=>{t.style.display="none"},600),this.searchBar=new Lr)}_setHudText(e,t){if(this._hudEls||(this._hudEls={},this._hudLast={}),this._hudLast[e]===t)return;let n=this._hudEls[e];n===void 0&&(n=this._hudEls[e]=document.getElementById(e)),n&&(n.textContent=t,this._hudLast[e]=t)}sampleTerrainSourceElevation(e,t){let n=e+this.worldOrigin.x,i=this.worldOrigin.y-t,r=bx(n,i),[a,o]=fn.tileOfUnit(r.q,r.r),l=`${a}_${o}`,c=this.tiles.get(l),h;if(c&&c.center&&c.unitHeights){let u=r.q-c.center.q,d=r.r-c.center.r,p=this.unitIndexMap.get(u+128<<8|d+128);h=p!==void 0?c.unitHeights[p]:void 0,h===void 0&&(h=c.stats?.avg)}else h=this.manifestGrid?.get(l)?.hMean;return{sourceElevation:h,wx:n,wy:i,axial:r,tq:a,tr:o}}maintainCameraAltitudeDuringAnimation(e){let t=this.controls.target,n=this.sampleTerrainSourceElevation(t.x,t.z);this._setHudText("sector-val",`${n.tq}, ${n.tr}`),this._setHudText("world-val",`${n.wx.toFixed(0)}, ${n.wy.toFixed(0)}`),this._setHudText("hex-val",`${n.axial.q}, ${n.axial.r}`);let i=n.sourceElevation;if(Number.isFinite(i)){let r=Th({cameraY:this.camera.position.y,targetY:t.y,sourceElevation:i,floor:this.floorState.value,factor:e});t.y=r.targetY,this.camera.position.y=r.cameraY;let a=this.sampleTerrainSourceElevation(this.camera.position.x,this.camera.position.z).sourceElevation,o=Number.isFinite(a)?Math.max(a,i):i,l=Ah({cameraY:this.camera.position.y,sourceElevation:o,floor:this.floorState.value,factor:e,clearance:Sx});this.camera.position.y=l.cameraY,this._setHudText("tile-height",`${r.terrainY.toFixed(1)}m`)}this._setHudText("camera-height",`${this.camera.position.y.toFixed(0)}m`)}updateFloorState(e){let t=this.pickFloorValue();Number.isFinite(t)&&(nu&&e>wx?((!this.floorState.locked||t<this.floorState.value)&&(this.floorState.value=t),this.floorState.locked=!0,this.floorState.provisional=!1,this.updateFloorUniforms()):nu?(this.floorState.value=t,this.floorState.provisional=!1,this.updateFloorUniforms()):(this.floorState.value=t,this.floorState.provisional=!1,this.updateFloorUniforms()))}pickFloorValue(){let e=this.getTilesInView(),t=e.length?e:Array.from(this.tiles.values()),n=1/0;for(let i of t)i.stats&&i.stats.min<n&&(n=i.stats.min);return Number.isFinite(n)?n:NaN}getTilesInView(){return this.camera.updateMatrixWorld(),this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projScreenMatrix),Array.from(this.tiles.values()).filter(e=>this.frustum.intersectsBox(e.bounds))}updateFloorUniforms(){for(let e of this.materialsToUpdate)e.userData.shader&&(e.userData.shader.uniforms.uFloorOffset.value=this.floorState.value)}deriveEngineState(e){if(this.isMovingView)return e?Vi.MOVING_2D:Vi.MOVING_3D;let t=this.recentlyUpgradedTextures.some(n=>performance.now()-n.time<100);return this.textureQueue.length>0||this.textureResultQueue.length>0||this.activeWorkerCount>0||t?Vi.SINTERING:Vi.STATIC}getDetailedStats(e="snapshot"){this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projScreenMatrix);let t=this.vramLedger.getSpatialBreakdown(this.frustum,this.camera.position,this.tiles),n=M=>M<1024?`${M} B`:M<1048576?`${(M/1024).toFixed(1)} KB`:M<1073741824?`${(M/1048576).toFixed(1)} MB`:`${(M/1073741824).toFixed(2)} GB`,i=0,r=0,a=0,o=0,l=0,c=0,h=0,u=0,d=0,p=0,g=0,x=0;for(let[M,S]of this.tiles){let E=(this.vramLedger.entries.get(M)?.geometryBytes||0)+this.vramLedger.textureBytesFor(M),N=this.visibilityByKey.get(M)?.classification||"outside",v=S.textureTier===Ne.HIGH;N==="visible"?(i++,o+=E,v?h++:u++):N==="guard"?(r++,l+=E,v?d++:p++):(a++,c+=E,v?g++:x++)}let m={low128:0,medium256:0,high4096:0},f={low128:0,medium256:0,high4096:0,none:0},b={low128:0,medium256:0,high4096:0};for(let M of this.textureStates.values()){for(let S of M.assets.keys())m[S]++;M.activeTier?f[M.activeTier]++:f.none++,b[M.desiredTier]++}let _=this.resourceRetries.snapshot(Qr);return{phase:e,timestamp:performance.now(),engineState:this.engineState,activeTileCount:this.tiles.size,tileClassification:{visible:{count:i,full:h,low:u,vram:n(o),bytes:o},buffer:{count:r,full:d,low:p,vram:n(l),bytes:l},vestigial:{count:a,full:g,low:x,vram:n(c),bytes:c}},vram:{geometryBytes:this.vramLedger.totalGeometryBytes,textureBytes:this.vramLedger.totalTextureBytes,totalBytes:this.vramLedger.totalVRAMBytes,highTextureBudgetBytes:this.cacheManager.budget,highTextureBytes:this.cacheManager.highBytes,highTextureBudgetUtilization:+this.cacheManager.utilization.toFixed(4),geometry:n(this.vramLedger.totalGeometryBytes),textures:n(this.vramLedger.totalTextureBytes),total:n(this.vramLedger.totalVRAMBytes),highTextureBudget:n(this.cacheManager.budget),highTextureHeadroom:n(this.cacheManager.headroom)},network:{totalPayloadBytes:this.vramLedger.totalNetworkBytes,binBytes:this.vramLedger._networkBin,texBytes:this.vramLedger._networkTex,total:n(this.vramLedger.totalNetworkBytes),bin:n(this.vramLedger._networkBin),tex:n(this.vramLedger._networkTex)},spatial:{inFrustumBytes:t.inFrustumBytes,outFrustumBytes:t.outFrustumBytes,nearBytes:t.nearBytes,midBytes:t.midBytes,farBytes:t.farBytes,inFrustumTiles:t.tileBreakdown.inFrustum,outFrustumTiles:t.tileBreakdown.outFrustum,inFrustumTexturePages:t.texturePageBreakdown.inFrustum,outFrustumTexturePages:t.texturePageBreakdown.outFrustum,inFrustumTextureAllocations:t.texturePageBreakdown.inFrustumAllocations,outFrustumTextureAllocations:t.texturePageBreakdown.outFrustumAllocations,geometryBytes:t.geometryBytes,texturePageBytes:t.textureBytes,inFrustum:`${t.tileBreakdown.inFrustum} geometry tiles + ${t.texturePageBreakdown.inFrustum} texture pages (${n(t.inFrustumBytes)})`,outFrustum:`${t.tileBreakdown.outFrustum} geometry tiles + ${t.texturePageBreakdown.outFrustum} texture pages (${n(t.outFrustumBytes)})`,near:n(t.nearBytes),mid:n(t.midBytes),far:n(t.farBytes)},tiles:{loaded:this.tiles.size,loadQueue:this.loadQueue.length,textureQueue:this.textureQueue.length,textureResultQueue:this.textureResultQueue.length,geometryRebuildQueue:this.geometryRebuildQueue.length,activeWorkers:this.activeWorkerCount,materialsTracked:this.materialsToUpdate.size,evictedTotal:this.cacheManager.evictionCount,evictedBytes:n(this.cacheManager.evictedBytes),redownloads:this.cacheManager.redownloadCount},textureResidency:{identity:"global-page",resident:m,active:f,desired:b,loading:Array.from(this.textureStates.values()).reduce((M,S)=>M+S.loading.size,0),queued:this.textureQueue.length,resultQueue:this.textureResultQueue.length,thresholdsPx:{mediumEnter:Pt.mediumEnterPx,mediumExit:Pt.mediumExitPx,highEnter:this.highTextureEnterPx||Pt.highEnterPx,highExit:(this.highTextureEnterPx||Pt.highEnterPx)*.75},maxTextureSize:this.texStats.maxTextureSize,highSourceSize:this.texStats.highSourceSize,highUploadSize:this.texStats.highUploadSize,highSkippedTopMips:this.texStats.highSkippedTopMips},failures:{manifest:{finalFailures:this.failureStats.manifestFailures,attemptsUsed:_.attempts,exhausted:_.exhausted},tiles:{failed:this.failedTiles.size,finalFailures:this.failureStats.tileFailures},textures:{failed:this.failedTextures.size,finalFailures:this.failureStats.textureFailures,errorCount:this._texErrorCount},recoverableSweeps:{pending:Array.from(this.recoverableResweeps.pending),scheduled:this.failureStats.recoverableSweepsScheduled,run:this.failureStats.recoverableSweepsRun},workers:{pendingJobs:this.pendingJobs.size,watchdogTimeouts:this.failureStats.workerTimeouts,respawns:this.failureStats.workerRespawns,failedJobs:this.failedWorkerJobs.size,finalFailures:this.failureStats.workerFailedJobs},context:{lost:this.failureStats.contextLost,restored:this.failureStats.contextRestored,recoveryFailures:this.failureStats.contextRecoveryFailures,recovering:this.contextRecovery.active},globalErrors:this.failureStats.globalErrors,unhandledRejections:this.failureStats.unhandledRejections},visibilityPlanner:this.visibilityPlanStats||null,texturePagePlanner:this.texturePagePlanStats||null,geometryFrontier:this.geometryFrontierStats||null,violations:this._perfViolationCount,allocationCount:this.vramLedger.entries.size+this.vramLedger.textureEntries.size,geometryAllocationCount:this.vramLedger.entries.size,texturePageAllocationCount:this.vramLedger.textureEntries.size,movingLod:this.getMovingLodDebugStats()}}getMovingLodDebugStats(){let e=0;for(let i of this.tiles.values()){let r=i.mesh?.children?.find(a=>a.userData.gosperLevel===this.movingLevel);r?.visible&&r.children[0]?.visible&&(e+=r.children[0].count)}let t=this.manifest?.tiles?.length||0,n=Math.max(0,t-this.tiles.size);return{active:this.isMovingView,level:this.movingLevel,flatToFlatMeters:+fn.levelSize(this.movingLevel).toFixed(3),residentCaps:e,fallbackTiles:n,fallbackCaps:this.movingHorizonMesh?.visible?n*(this.movingHorizonChildrenPerTile||0):0,settledHorizonVisible:!!this.horizonMesh?.visible,movingHorizonVisible:!!this.movingHorizonMesh?.visible,visibleLevels:this.isMovingView?[this.movingLevel]:"settled-multi-lod"}}animate(){requestAnimationFrame(()=>this.animate()),this._frameCounter++,ys("processInstantiationQueue",()=>this.processInstantiationQueue()),ys("processTextureResults",()=>this.processTextureResults()),ys("processQueues",()=>this.processQueues());let e=performance.now();this.controls.enableDamping=this.isUserInteracting;let t=this.controls.update();Vr(this.camera,this.controls.target,this.observedCameraPose),Mh(this.lastObservedCameraPose,this.observedCameraPose)&&this.notifyCameraMotion(e);let n=this.controls.getPolarAngle()*180/Math.PI,i=n<5.5,r=this.syncHeightFactorFromControls(n),a=this.isMovingView,o=this.wasMovingView;!this.cameraMotion.sample({now:e})&&this.isMovingView&&(this.isMovingView=!1),this.engineState=this.deriveEngineState(i),a&&!this.isMovingView&&(this.needsRender=!0,this.needsLODUpdate=!0,this._beginGeometryMode(!1),this._runRecoverableResweep()),this.isMovingView?this.needsLODUpdate=!0:a&&(this.needsLODUpdate=!0);let c=this.floorState.value,h=this.camera.position.y;this.updateFloorState(r),this.maintainCameraAltitudeDuringAnimation(r),Vr(this.camera,this.controls.target,this.lastObservedCameraPose),(this.floorState.value!==c||this.camera.position.y!==h)&&(this.needsLODUpdate=!0,this.needsRender=!0);let u=this.camera.position.distanceTo(this.lastLODCamPos);(u>50||this.needsLODUpdate||!this.loaderHidden)&&(ys("updateLOD",()=>this.updateLOD()),u>50&&this.lastLODCamPos.copy(this.camera.position),this.needsLODUpdate=!1),this.loaderHidden||this._updateTexBadge();let d=t||this.needsRender;if(this.profiler?.frame(e,this.engineState,d),this.updateFps(e,d),!d)return;let p=performance.now();this.updateRenderStats(e),this.updateFrametimeGraph(),o!==this.isMovingView&&(this.horizonMesh&&(this.horizonMesh.visible=!this.isMovingView),this.movingHorizonMesh&&(this.movingHorizonMesh.visible=this.isMovingView)),this.wasMovingView=this.isMovingView,this.computeLodRadii(),this.updateLevelVisibility(r),this._updateTexBadge();let g=0;for(let f of this.materialsToUpdate)if(f.needsUpdate&&g++,f.userData.shader){f.userData.shader.uniforms.uHeightFactor.value=r,f.userData.shader.uniforms.uFloorOffset.value=this.floorState.value;let b=f.userData.shader.uniforms.uCameraPos;if(b?.value?.copy&&b.value.copy(this.camera.position),f.userData.isHorizon)continue;if(f.userData.shader.uniforms.uGradientMode.value=this.gradientMode,f.userData.lodIdx!==void 0){let _=f.userData.lodIdx;if(f.userData.forceMovingMode&&_===this.movingLevel)f.userData.shader.uniforms.uLodRadii.value.set(0,1e12),f.userData.shader.uniforms.uFinestBuilt.value=1;else{let M=_<=0?0:this.lodRadii[_-1],S=this.lodRadii[_];f.userData.shader.uniforms.uLodRadii.value.set(M,S),f.userData.shader.uniforms.uFinestBuilt.value=f.userData.isFinest?1:0}}}this.renderer.render(this.scene,this.camera);let x=performance.now()-p,m=_x[this.engineState];if(x>m)if(this._perfViolationCount++,this._perfViolationCount<=yx){let f=[];g>0&&f.push(`mat-recompile:${g}`);let b=this.recentlyUpgradedTextures.filter(_=>e-_.time<50);b.length>0&&f.push(`tex-upgrade:${b.length}`),this.recentlyUpgradedTextures=b.slice(-3),this.geometryRebuildQueue.length>0&&f.push(`geometry-rebuild-queue:${this.geometryRebuildQueue.length}`),f.length===0&&f.push("gpu-render"),console.log("[PERF_VIOLATION] "+JSON.stringify({state:this.engineState,duration:+x.toFixed(1),budget:m,culprits:f,frame:this._frameCounter}))}else{let f=this.engineState;this._perfStats[f]||(this._perfStats[f]={min:1/0,max:-1/0,sum:0,count:0});let b=this._perfStats[f];if(b.min=Math.min(b.min,x),b.max=Math.max(b.max,x),b.sum+=x,b.count++,Object.values(this._perfStats).reduce((M,S)=>M+S.count,0)>=eu){let M={};for(let[S,R]of Object.entries(this._perfStats))M[S]={count:R.count,avg:+(R.sum/R.count).toFixed(1),min:+R.min.toFixed(1),max:+R.max.toFixed(1)};console.log("[PERF_VIOLATION] "+JSON.stringify({type:"stats",totalViolations:this._perfViolationCount,window:eu,summary:M,frame:this._frameCounter})),this._perfStats={}}}this.needsRender=!1}};new ka;th(window.pistonViewer,eo)});Cx();})();
