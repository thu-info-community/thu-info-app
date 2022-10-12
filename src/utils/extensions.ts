export {};

// eslint-disable-next-line no-extend-native
Date.prototype.format = function () {
	return `${this.getFullYear()}-${this.getMonth() + 1}-${this.getDate()}`;
};

// eslint-disable-next-line no-extend-native
String.prototype.format = function () {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function (match, number) {
		return typeof args[number] !== "undefined" ? args[number] : match;
	});
};

if (global.FileReader) {
	FileReader.prototype.readAsArrayBuffer = function (blob) {
		if (this.readyState === this.LOADING) {
			throw new Error("InvalidStateError");
		}
		// @ts-ignore
		this._setReadyState(this.LOADING);
		// @ts-ignore
		this._result = null;
		// @ts-ignore
		this._error = null;
		const fr = new FileReader();
		fr.onloadend = () => {
			const content = atob(
				// @ts-ignore
				fr.result.substr("data:application/octet-stream;base64,".length),
			);
			const buffer = new ArrayBuffer(content.length);
			const view = new Uint8Array(buffer);
			view.set(Array.from(content).map((c) => c.charCodeAt(0)));
			// @ts-ignore
			this._result = buffer;
			// @ts-ignore
			this._setReadyState(this.DONE);
		};
		fr.readAsDataURL(blob);
	};
}
