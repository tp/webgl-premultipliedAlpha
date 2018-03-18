const vertexShader = `
attribute vec4 position;

void main(void) {
    gl_Position = position;
}
`;

const fragmentShader = `
#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D tex0;

uniform vec2 resolution;

void main(void)
{
    // Flip the y-coordinate, as WebGL thinks the origin is at bottom left corner.
    vec2 coordinate = vec2(gl_FragCoord.x, resolution.y-gl_FragCoord.y);

    vec2 uv = coordinate.xy/resolution.xy;

    vec4 pixel = texture2D(tex0, uv).xyzw;

    gl_FragColor = vec4(pixel.x * pixel.w, pixel.y * pixel.w, pixel.z * pixel.w, pixel.w);
}
`;

function main() {
    const size = 500;
    const canvas = document.createElement(`canvas`);
    canvas.width = size;
    canvas.height = size;
    canvas.style.position = `absolute`;
    canvas.style.left = `${(window.innerWidth - size) / 2}px`;
    canvas.style.top = `${(window.innerHeight - size) / 2}px`;
    canvas.style.width = `${size / 2}px`;
    canvas.style.height = `${size / 2}px`;
    document.body.appendChild(canvas);

    /** @type {WebGLRenderingContext} */
    const gl = canvas.getContext(`webgl`, {
        alpha: true,
        premultipliedAlpha: true,
    });
    const texture = createTexture(gl, canvasWithText(size, size));
    /** @type {WebGLProgram} */
    const shader = createProgram(gl, vertexShader, fragmentShader);
    gl.enableVertexAttribArray(gl.getAttribLocation(shader, "position"));

    const vertices = new Float32Array([
        -1.0,-1.0, 1.0,-1.0, -1.0,1.0,
        1.0,-1.0, 1.0,1.0, -1.0,1.0
    ]);

    const vertexBuffer = gl.createBuffer();

    function draw() {
        gl.useProgram(shader);

        // Activate this.vertexBuffer as array buffer for vertices.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        // Bind the vertex position to the attribute "position" of our shader.
        const positionLocation =  gl.getAttribLocation(shader, "position");
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Load texture into slot 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell our shader to use the texture from the slot 0.
        gl.uniform1i(gl.getUniformLocation(shader, "tex0"), 0);

        gl.uniform2f(gl.getUniformLocation(shader, "resolution"), size, size);

        gl.viewport(0, 0, size, size);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0, 0, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    }

    draw();
}

function createTexture(gl, canvas) {
    /** @type {WebGLTexture} */
    const texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return texture;
}

function canvasWithText(width, height) {
    const canvas = document.createElement(`canvas`);
    canvas.width = width;
    canvas.height = height;
    
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext(`2d`);
    
    ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
    ctx.font = `bold ${Math.floor(height / 3)}px sans-serif`;
    ctx.fillText(`Hello!`, 0, height / 3);

    return canvas;
}

function createProgram(gl, vsCode, fsCode) {
    const program = gl.createProgram();

    let vs, fs;
    try {
        vs = compileShader(gl, vsCode, gl.VERTEX_SHADER);
        fs = compileShader(gl, fsCode, gl.FRAGMENT_SHADER);
    } catch (e) {
        gl.deleteProgram( program );
        throw e;
    }

    gl.attachShader(program, vs);
    gl.deleteShader(vs);
    gl.attachShader(program, fs);
    gl.deleteShader(fs);
    gl.linkProgram(program);

    return program;
}

function compileShader(gl, code, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "SHADER ERROR: " + gl.getShaderInfoLog(shader);
    }
    return shader;
}

main();
