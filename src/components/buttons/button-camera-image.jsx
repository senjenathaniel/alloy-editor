import React from 'react';
import ReactDOM from 'react-dom';

/**
 * The ButtonCameraImage class takes photo from camera and inserts it to the content.
 *
 * @class ButtonCameraImage
 */
class ButtonCameraImage extends React.Component {
	/**
	 * Lifecycle. Returns the default values of the properties used in the widget.
	 *
	 * @instance
	 * @memberof ButtonCameraImage
	 */
	static defaultProps = {
		videoWidth: 320,
	};

	/**
	 * The name which will be used as an alias of the button in the configuration.
	 *
	 * @default cameraImage
	 * @memberof ButtonCameraImage
	 * @property {String} key
	 * @static
	 */
	static key = 'cameraImage';

	/**
	 * Lifecycle. Invoked once, only on the client, immediately after the initial rendering occurs.
	 *
	 * Focuses the take photo button.
	 *
	 * @instance
	 * @memberof ButtonCameraImage
	 * @method componentDidMount
	 */
	componentDidMount() {
		ReactDOM.findDOMNode(this.refs.buttonTakePhoto).focus();
	}

	/**
	 * Lifecycle. Invoked immediately before a component is unmounted from the DOM.
	 *
	 * @instance
	 * @memberof ButtonCameraImage
	 * @method componentWillUnmount
	 */
	componentWillUnmount() {
		if (this._stream) {
			if (this._stream.stop) {
				this._stream.stop();
			} else if (this._stream.getVideoTracks) {
				this._stream.getVideoTracks().forEach(function(track) {
					track.stop();
				});
			}
			this._stream = null;
		}
	}

	/**
	 * Lifecycle. Renders the UI of the button.
	 *
	 * @instance
	 * @memberof ButtonCameraImage
	 * @method render
	 * @return {Object} The content which should be rendered.
	 */
	render() {
		const getUserMedia =
			navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;

		getUserMedia.call(
			navigator,
			{
				video: true,
				audio: false,
			},
			this._handleStreamSuccess,
			this._handleStreamError
		);

		return (
			<div className="ae-camera">
				<video ref="videoContainer">Video stream not available.</video>
				<button
					className="ae-camera-shoot"
					onClick={this.takePhoto}
					ref="buttonTakePhoto">
					Take photo
				</button>
				<canvas className="ae-camera-canvas" ref="canvasContainer" />
			</div>
		);
	}

	/**
	 * Takes photo from the video stream and inserts in into editor's content.
	 *
	 * @fires ButtonCameraImage#imageCameraAdd
	 * @instance
	 * @memberof ButtonCameraImage
	 * @method takePhoto
	 */
	takePhoto = () => {
		const videoEl = ReactDOM.findDOMNode(this.refs.videoContainer);
		const canvasEl = ReactDOM.findDOMNode(this.refs.canvasContainer);

		const context = canvasEl.getContext('2d');

		const height = this._videoHeight;
		const width = this.props.videoWidth;

		if (width && height) {
			canvasEl.width = width;
			canvasEl.height = height;

			context.drawImage(videoEl, 0, 0, width, height);

			const imgURL = canvasEl.toDataURL('image/png');

			const el = CKEDITOR.dom.element.createFromHtml(
				'<img src="' + imgURL + '">'
			);

			const editor = this.props.editor.get('nativeEditor');

			editor.insertElement(el);

			this.props.cancelExclusive();

			editor.fire('actionPerformed', this);

			editor.fire('imageCameraAdd', el);
		}
	};

	/**
	 * Displays error message in case of video stream capturing failure.
	 *
	 * @instance
	 * @memberof ButtonCameraImage
	 * @method _handleStreamError
	 * @param {Event} error The fired event in case of error.
	 * @protected
	 */
	_handleStreamError = error => {
		window.alert('An error occurred! ' + error);
	};

	/**
	 * Starts streaming video in the video element and sets width/height to the video
	 * and canvas elements.
	 *
	 * @instance
	 * @memberof ButtonCameraImage
	 * @method _handleStreamSuccess
	 * @param {Object} stream The video stream
	 * @protected
	 */
	_handleStreamSuccess = stream => {
		const videoEl = ReactDOM.findDOMNode(this.refs.videoContainer);
		const canvasEl = ReactDOM.findDOMNode(this.refs.canvasContainer);

		videoEl.addEventListener(
			'canplay',
			() => {
				let height =
					videoEl.videoHeight /
					(videoEl.videoWidth / this.props.videoWidth);

				if (isNaN(height)) {
					height = this.props.videoWidth / (4 / 3);
				}

				videoEl.setAttribute('width', this.props.videoWidth);
				videoEl.setAttribute('height', height);
				canvasEl.setAttribute('width', this.props.videoWidth);
				canvasEl.setAttribute('height', height);

				this._videoHeight = height;
			},
			false
		);

		this._stream = stream;

		if (navigator.mozGetUserMedia) {
			videoEl.mozSrcObject = stream;
		} else {
			videoEl.srcObject = stream;
		}

		videoEl.play();

		ReactDOM.findDOMNode(this.refs.buttonTakePhoto).disabled = false;
	};

	/**
	 * Fired when an image is being taken from the camera and added as an element to the editor.
	 *
	 * @event ButtonCameraImage#imageCameraAdd
	 * @memberof ButtonCameraImage
	 * @param {CKEDITOR.dom.element} el The created img element in editor.
	 */
}

export default ButtonCameraImage;