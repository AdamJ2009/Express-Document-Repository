var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var uploadForm = document.getElementById('uploadForm');
var statusDiv = document.getElementById('status');
if (uploadForm) {
    uploadForm.addEventListener('submit', function (e) { return __awaiter(_this, void 0, void 0, function () {
        var fileInput, customNameInput, importanceInput, archiveSelect, accessInput, formData, customNameValue, response, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!statusDiv)
                        return [2 /*return*/];
                    fileInput = document.getElementById('documentFile');
                    customNameInput = document.getElementById('fileName');
                    importanceInput = document.getElementById('importanceFlag');
                    archiveSelect = document.getElementById('archiveFlag');
                    accessInput = document.getElementById('accessFlag');
                    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
                        statusDiv.style.color = 'red';
                        statusDiv.textContent = 'Please select a file to upload.';
                        return [2 /*return*/];
                    }
                    formData = new FormData();
                    customNameValue = customNameInput && customNameInput.value.trim() ? customNameInput.value.trim() : '';
                    formData.append('custom_file_name', customNameValue);
                    formData.append('fileName', customNameValue);
                    formData.append('importance_flag', importanceInput ? importanceInput.value : '0');
                    formData.append('archive_flag', archiveSelect ? archiveSelect.value : '0');
                    formData.append('access_flag', accessInput ? accessInput.value : '0');
                    // 2. Append binary file LAST
                    formData.append('document', fileInput.files[0]);
                    statusDiv.style.color = 'black';
                    statusDiv.textContent = 'Uploading...';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('/upload', {
                            method: 'POST',
                            body: formData
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (response.ok) {
                        statusDiv.style.color = 'green';
                        statusDiv.textContent = "Success! Added Document ID: ".concat(result.id, ". Redirecting...");
                        uploadForm.reset();
                        setTimeout(function () {
                            window.location.href = '/';
                        }, 1500);
                    }
                    else {
                        statusDiv.style.color = 'red';
                        statusDiv.textContent = result.error || 'Upload failed.';
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    statusDiv.style.color = 'red';
                    statusDiv.textContent = 'Error uploading document.';
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
}
