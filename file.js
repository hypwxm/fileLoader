//下面用于图片上传和文件上传预览功能
//opts为可以传入的文件类型

var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;


/*
 * @params
 *   @####opts
 *  ********resource  file类型的元素  .类名或 #id********  必须
 *  *  ********target  放置预览图区域  .类名或 #id********  可选
 *  *  ********fullSize  总文件尺寸大小********  默认不限制
 *  *  ********size  单文件尺寸大小限制********   默认不限制
 *  *  ********num  上传最大文件总数********  默认不限制
 *  *  ********allowedType********  限制文件类型
 *  *  ********allowedExtensions********   限制文件扩展名
 *  *  ********drag********   是否允许拖拽  （true时可拖拽）
 *  *  ********exFilter********   方法，扩展的过滤器，必须返回一个数组，否则会报错
 *  *  ********bigView********   是否允许用户放大图片
 *  *  ********multi********   true允许多图，如果不指定这个属性即使file写了multiple属性也不允许多图
 /*
 *  *  ********immediately******** 图片添加成功立即执行的方法，比如ajax上传(有错误信息无法上传) 
 * @params {
 *          _file:当前文件
 *          files：当前实例内的所有符合规定的文件
 *          }
 * /
 /*  *  ********aftercancel******** 点击删除，删除单张图片的时候触发的方法
 *  @params {_file:删除的当前文件的相关信息}
 */

/*  *  ********aftercancelAll******** 点击删除，删除当前实例内所有图片时触发的方法
 * */


/*
 * ******** fileErrorFun************，当前文件如果太大没有完成上传，那没会执行到这个函数，
 * @params
 *   ｛
 *       file：文件太大而无法完成上传的目前单个文件。是个文件对象。
 *   ｝
 * */


/*
* ******** openFileChangePos *****  是否开启图片可拖动进行位置排序（true表示开启），排序对页面显示进行调整。同时对实例的files数组也会调整为对应顺序。
* */

/*
* ****** afterFilesPosChange *****  重新排序后执行的方法。如果openFileChangePos ！= true 那么这个将会无效。参数为重新排序后的实例的files数组。
* */

function SetUploaderFilesPreview(opts) {
    this.target = null;//初始化图片放置区域
    this.resource = null;//初始化文件源
    this.files = [];  //单前页面预览图的所有可以上传成功的图片数组
    this.filesNameType = []; //单前页面预览图的所有可以上传成功的图片信息，防止重名添加格式为 （file.name + “，” + file.type）
    this.allSize = 0; //单前页面预览图的所有可以上传成功的图片总大小，有error属性的不会算入其中
    this.allNum = 0; //单前页面预览图的所有可以上传成功的图片总数，有error属性的不会算入其中
    this.index = 0; //页面中存在的预览区的图片的索引标识符，
    this.errors = 0; //为每个错误对象指定一个标识符
    this.opts = opts; //实例化后的传入参数
    this.openFileChangePos = opts.openFileChangePos;//判断是否开启图片拖动重新排序图片位置
    this.afterFilesPosChange = opts.afterFilesPosChange;
    this.init();
    if (opts.drag == true) {
        this.allowedDrag();
    }

    if (opts.multi == true) {
        this.multi = true;
    }
}


//初始化参数
SetUploaderFilesPreview.prototype.init = function () {

    var self = this;

    //如果没有指定图片的放置区域，会自动生成，如果页面存在默认指定的类名，就使用。
    if (typeof self.opts.target == "undefined") {
        if (!self.filePreviewZone) {
            var filePreviewZone = document.createElement("div");
            filePreviewZone.className = "filePreviewZone";
            document.body.appendChild(filePreviewZone);
            self.target = filePreviewZone;
        }

        //重新执行target的赋值
        //self.opts.target = ".filePreviewZone";
    } else {
        self.target = document.querySelector(self.opts.target);
    }

    //resource必须存在
    if (typeof self.opts.resource == "undefined") {
        throw new Error("You need a input with type of file.")
    }

    //resource的值必须是类名或id
    if (!/^[\.|#]/.test(self.opts.resource)) {
        throw new Error("You need set resource with a classname or id.")
    }

    self.resource = document.querySelector(self.opts.resource);

    self.change.call(self);
};

//是否开启拖拽
SetUploaderFilesPreview.prototype.allowedDrag = function () {
    var self = this;
    if (self.opts.drag = true) {
        self.fileDragEnter();
        self.fileDragLeave();
        self.fileDrop();
    }
};

SetUploaderFilesPreview.prototype.change = function () {

    var self = this;

    document.addEventListener("change", function (event) {
        var target = event.target;
        if (target == self.resource) {
            var filesZone = self.resource;
            var filesPreview = self.target;
            if (filesZone.files && filesZone.files[0]) {

                //获取所有文件列表
                var allFiles = Array.prototype.slice.call(filesZone.files);

                if (allFiles.length == 0) {
                    return false;
                }

                allFiles = self.singleUpload(allFiles);
                allFiles = self.filterFiles(self, allFiles);

                if (!allFiles) {
                    return false;
                }

                var fileHTML = document.createDocumentFragment();

                for (var _file = 0, len = allFiles.length; _file < len; _file++) {
                    //self.putFilesZone(allFiles[_file], fileHTML);
                    self.putFilesZone(allFiles[_file], filesPreview);
                }

                //filesPreview.appendChild(fileHTML)
            }

            self.clearFile();
        }
    }, false);

};

SetUploaderFilesPreview.prototype.singleUpload = function (allfiles) {
    var self = this, newFiles;
    if (self.multi != true) {
        //只取第一个
        newFiles = allfiles.slice(0, 1);
        var filesPreview = self.target;
        filesPreview.innerHTML = "";
        self.allNum = 0;
        self.allSize = 0;
        self.files = [];
        self.filesNameType = [];
        return newFiles;
    } else {
        return allfiles
    }
};


//限制文件类型
SetUploaderFilesPreview.prototype.allowedType = function (allFiles) {
    var self = this;
    if (self.opts.allowedType) {
        if (!Array.isArray(self.opts.allowedType)) {
            throw new Error("AllowedType need to be an array");
        }
        if (self.opts.allowedType.length != 0) {
            var _type;
            var notAllowed = allFiles.some(function (ele) {
                _type = ele.type.match(/\.*([^\/]*)\/\.*/)[1];
                return self.opts.allowedType.indexOf(_type.toLowerCase()) < 0;
            });

            if (notAllowed) {
                self.createLitTip("存在不允许的文件类型，请重新选择");
                alert("存在非法文件，请重新添加");
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    } else {
        return true;
    }
};


//限制文件扩展名
SetUploaderFilesPreview.prototype.allowedFileExtensions = function (allFiles) {
    var self = this;
    if (self.opts.allowedFileExtensions) {
        if (!Array.isArray(self.opts.allowedFileExtensions)) {
            throw new Error("AllowedType need to be an array");
        }
        if (self.opts.allowedFileExtensions.length != 0) {
            var notAllowed = allFiles.some(function (ele) {
                return self.opts.allowedFileExtensions.indexOf(ele.name.slice(ele.name.lastIndexOf(".") + 1, ele.name.length).toLowerCase()) < 0;
            });

            if (notAllowed) {
                self.createLitTip("存在不允许的文件扩展名，请重新选择");
                alert("存在非法扩展名，请重新添加");
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    } else {
        return true;
    }
};


//同文件判断
SetUploaderFilesPreview.prototype.sameFileHere = function (_self, newFiles) {
    var allFiles = newFiles.filter(function (ele) {

        if (_self.filesNameType.indexOf(ele.name + "," + ele.type) > -1) {
            _self.createLitTip(ele.name + "文件已存在。")
        }

        //console.log(_self.filesNameType.indexOf(ele.name + "," + ele.type));

        return _self.filesNameType.indexOf(ele.name + "," + ele.type) < 0;
    });
    allFiles.forEach(function (ele) {
        _self.filesNameType.push(ele.name + "," + ele.type);
    });
    return allFiles;
};


//在设定了fullSize属性后，对新拉入的文件总大小进行判断，
SetUploaderFilesPreview.prototype.ifFilesTooBig = function (allFiles) {
    var self = this;
    if (self.opts.fullSize) {
        //文件总大小
        if (!/^\d+$/.test(self.opts.fullSize)) {
            throw new Error("Size need to be a number")
        } else {
            var allSize = 0;
            allFiles.forEach(function (ele) {
                if (self.opts.size && (Number(ele.size) <= Number(self.opts.size))) {
                    //单文件大小
                    if (!/^\d+$/.test(self.opts.size)) {
                        throw new Error("Size need to be a number")
                    } else {
                        allSize += Number(ele.size);
                    }
                } else {
                    allSize += Number(ele.size);
                }

            });
            if (self.allSize + allSize > self.opts.fullSize) {
                alert("文件大于" + self.opts.fullSize / 1024 / 1024 + "MB，无法完成上传。");
                self.createLitTip("文件大于" + self.opts.fullSize / 1024 / 1024 + "MB，添加失败。");

                var newNameType = [];
                allFiles.forEach(function (ele) {
                    newNameType.push(ele.name + "," + ele.type);
                });
                self.filesNameType = self.filesNameType.filter(function (ele) {
                    if (newNameType.indexOf(ele) < 0) {
                        return ele;
                    }
                });
                allFiles = [];
                self.clearFile();
                return false;
            } else {
                return true;
            }
        }
    } else {
        return true;
    }

};


//如果有size属性，判断单文件大小
SetUploaderFilesPreview.prototype.ifFileTooBig = function (_file) {
    var self = this;
    if (self.opts.size) {
        //单文件大小
        if (!/^\d+$/.test(self.opts.size)) {
            throw new Error("Size need to be a number")
        } else {

            if (Number(_file.size) > Number(self.opts.size)) {
                _file.error = "fileError" + self.errors;
                self.errors++;
                _file.errorTipDom = self.createLitTip(_file.name + "大小超过了" + self.opts.size / 1024 / 1024 + "MB，该文件不会上传。", _file.error);

                var fileErrorOptsFun = self.opts.fileErrorFun;

                if (typeof fileErrorOptsFun == "function") {
                    setTimeout(function () {
                        fileErrorOptsFun(_file);
                    }, 100);

                } else if (typeof fileErrorOptsFun != "undefined") {
                    console.warn("'fileErrorFun'请设置为一个函数。")
                }

            }

        }
    }
};


//如果有num属性，判断可上传文件总数
SetUploaderFilesPreview.prototype.allowedNumber = function (allFiles) {

    var self = this;
    if (self.opts.num) {
        if (!/^\d+$/.test(self.opts.num)) {
            throw new Error("num need to be a number")
        } else {
            if (Number(allFiles.length) + self.allNum > Number(self.opts.num)) {
                alert("最多只能上传" + self.opts.num + "个文件。");
                self.createLitTip("文件数量超过了" + self.opts.num + "个。");
                var newNameType = [];
                allFiles.forEach(function (ele) {
                    newNameType.push(ele.name + "," + ele.type);
                });
                self.filesNameType = self.filesNameType.filter(function (ele) {
                    if (newNameType.indexOf(ele) < 0) {
                        return ele;
                    }
                });
                self.clearFile();
                return false;
            } else {
                //self.allNum = self.allNum + Number(allFiles.length);
                return true;
            }
        }
    } else {
        return true;
    }
};

//清空file文本域
SetUploaderFilesPreview.prototype.clearFile = function () {
    var self = this;

    var filesZone = self.resource;
    var filesZoneClone = filesZone.cloneNode(true);
    self.resource = filesZoneClone;
    filesZone.parentNode.insertBefore(filesZoneClone, filesZone);
    filesZoneClone.value = "";
    filesZone.parentNode.removeChild(filesZone);
};

//新增图片放入预览区
SetUploaderFilesPreview.prototype.putFilesZone = function (_file, target) {
    var self = this;
    _file.index = self.index;
    self.index++;
    var uploadFiles = document.createElement("a");
    uploadFiles.className = "uploadfiles";
    uploadFiles.setAttribute("name", _file.name);
    uploadFiles.setAttribute("type", _file.type);
    _file.uploadFile = uploadFiles;
    self.cancelFileDOM(uploadFiles, _file);
    self.isFileLoadedDOM(uploadFiles);

    if (/image/.test(_file.type)) {
        var img = document.createElement("img");
        img.src = window.URL.createObjectURL(_file);


        uploadFiles.appendChild(img);

        if (self.opts.bigView == true) {
            self.bigView(uploadFiles, _file);
        }

    } else {
        uploadFiles.appendChild(document.createTextNode(_file.name));
    }

    self.cancelAllDOM();

    if (_file.error && _file.error.indexOf("fileError") > -1) {
        uploadFiles.classList.add("fileError");
        uploadFiles.classList.add(_file.error);
        alert(_file.name + "文件过大，已取消该文件。");
        return;
    } else {
        self.allNum++;
        self.allSize += _file.size;
        self.files.push(_file);

        //判断是否开启图片拖动重新排序图片位置
        if (self.openFileChangePos == true) {
            self.filePosChange.call(self, _file);
        }
    }
    self.fileInfo(uploadFiles, _file);

    uploadFiles.setAttribute("index", self.index - 1);
    uploadFiles.classList.add("uploadFiles" + (self.index - 1));

    target.appendChild(uploadFiles);

    //图片选择完成就立即执行的方法
    if (typeof self.opts.immediately == "function") {
        self.opts.immediately(_file, self.files);
    }


};

//取消按钮dom'
SetUploaderFilesPreview.prototype.cancelFileDOM = function (uploadFiles, _file) {
    //取消上传
    var cancelfile = document.createElement("input");
    cancelfile.type = "button";
    cancelfile.className = "cancelfile";
    cancelfile.value = "";
    uploadFiles.appendChild(cancelfile);
    _file.cancelBtn = cancelfile;
    this.cancelFile(cancelfile, _file);
};


//取消功能
SetUploaderFilesPreview.prototype.cancelFile = function (cancelbtn, _file) {
    var self = this;
    cancelbtn.onclick = function () {
        self.clearFile();

        cancelbtn.onclick = null;
        if (_file.bigViewBtn) {
            _file.bigViewBtn.onclick = null;
        }

        //setTimeout(function () {
        if (typeof self.opts.aftercancel == "function") {
            self.opts.aftercancel(_file);
        }

        //});


        if (Array.prototype.slice.call(self.target.querySelectorAll(".uploadfiles")).length == 1) {
            self.files = [];
            self.filesNameType = [];
            self.target.innerHTML = "";
            self.allNum = 0;
            return;
        }

        if (!cancelbtn.parentNode.classList.contains("fileError")) {

            self.files = self.files.filter(function (file) {
                if (file.index == cancelbtn.parentNode.getAttribute("index")) {
                    self.remove = file;
                }
                return file.index != cancelbtn.parentNode.getAttribute("index");
            });
            if (self.remove) {
                self.allSize -= Number(self.remove.size);
                self.allNum--;
                self.remove = null;
            }

        } else {
            self.deleteOneTip(_file.errorTipDom);
        }

        var _uploader = cancelbtn.parentNode;
        var name = _uploader.getAttribute("name");
        var type = _uploader.getAttribute("type");
        self.filesNameType.splice(self.filesNameType.indexOf(name + "," + type), 1);

        cancelbtn.parentNode.parentNode.removeChild(cancelbtn.parentNode);

    };
};


//取消所有DOM
SetUploaderFilesPreview.prototype.cancelAllDOM = function () {
    var self = this, cancelAll;
    if (!self.target.querySelector(".cancelAll")) {
        cancelAll = document.createElement("input");
        cancelAll.type = "button";
        cancelAll.className = "cancelAll";
        self.target.appendChild(cancelAll);
    }
    self.cancelAll.call(this);
};

//取消所有
SetUploaderFilesPreview.prototype.cancelAll = function () {
    var self = this;
    self.target.querySelector(".cancelAll").onclick = function () {
        self.clearFile();

        self.files.forEach(function (file) {
            if (file.cancelBtn) {
                file.cancelBtn.onclick = null;
            }
            if (file.bigViewBtn) {
                file.bigViewBtn.onclick = null;
            }
        });

        self.target.innerHTML = "";
        self.filesNameType = [];
        self.files = [];
        self.allNum = 0;

        setTimeout(function () {
            if (typeof aftercancelAll == "function") {
                self.opts.aftercancelAll();
            }
        });
    };
};


//是否上传dom
SetUploaderFilesPreview.prototype.isFileLoadedDOM = function (uploadFiles) {
    //显示是否已经上传
    var fileloaded = document.createElement("span");
    fileloaded.title = "还未上传";
    fileloaded.className = "fileloaded";
    fileloaded.innerText = "no";
    uploadFiles.appendChild(fileloaded);
};


//放大镜DOM
SetUploaderFilesPreview.prototype.bigViewDOM = function () {
    if (document.querySelector(".showView")) return;
    var showView = document.createElement("div");
    showView.className = "showView";
    var closeView = document.createElement("input");
    closeView.type = "button";
    closeView.className = "closeView";
    closeView.value = "close";
    showView.appendChild(closeView);
    document.body.appendChild(showView);
    this.closeView(closeView);
};


//可选的左右切换按钮
SetUploaderFilesPreview.prototype.viewChangeBtnDOM = function () {
    var self = this;
    var changeBtn = document.createElement("div");
    changeBtn.className = "changeBtn";
    if (document.querySelector(".showView")) {
        document.querySelector(".showView").appendChild(changeBtn);
    } else {
        self.bigViewDOM();
        arguments.callee();
    }
};


//放大镜
SetUploaderFilesPreview.prototype.bigView = function (uploadFiles, _file) {
    var bigview = document.createElement("input");
    bigview.type = "button";
    bigview.title = "点击放大图片";
    bigview.className = "bigview";
    //bigview.innerText = "";
    uploadFiles.appendChild(bigview);
    this.show(bigview);
    _file.bigViewBtn = bigview;
};


//点击放大镜，点击事件
SetUploaderFilesPreview.prototype.show = function (bigbtn) {
    var self = this;
    bigbtn.onclick = function () {

        self.disableMove();
        self.showBegin(bigbtn, self);
        var showView = document.querySelector(".showView");
        showView.classList.add("openedview");
        showView.classList.add("viewinit");
        setTimeout(function () {
            showView.classList.remove("openedview");
            showView.style.cssText = "height:90%;width:90%;left:5%;top:5%;";
        }, 600);

    };
};


//阻止默认事件
SetUploaderFilesPreview.prototype.prevent = function (event) {
    event.preventDefault();
};


//图片放大，禁止屏幕拖动
SetUploaderFilesPreview.prototype.disableMove = function () {
    var self = this;
    document.addEventListener("touchmove", self.prevent, false)
};


//关闭预览图，打开可拖动
SetUploaderFilesPreview.prototype.enableMove = function () {
    var self = this;
    document.removeEventListener("touchmove", self.prevent, false)
};


//预览图放大  创建预览图
SetUploaderFilesPreview.prototype.showBegin = function (img, self) {
    self.bigViewDOM();
    var showView = document.querySelector(".showView");
    var viewimgbox = document.createElement("div");
    viewimgbox.className = "viewimgbox";
    var innerBox = document.createElement("div");
    innerBox.className = "innerBox";
    viewimgbox.appendChild(innerBox);
    showView.appendChild(viewimgbox);
    var sourceimg = img.previousSibling;
    var sourcesec = sourceimg.src;
    var viewimg = document.createElement("img");
    viewimg.className = "viewimg";
    viewimg.src = sourcesec;
    var viewposition = sourceimg.getBoundingClientRect();
    var viewleft = viewposition.left;
    var viewtop = viewposition.top;
    var viewHeight = sourceimg.clientHeight;
    var viewWidth = sourceimg.clientWidth;
    innerBox.appendChild(viewimg);

    //初始化预览框所在位置为原图的位置，
    showView.style.left = viewleft + "px";
    showView.style.top = viewtop + "px";
    showView.style.width = viewWidth + "px";
    showView.style.height = viewHeight + "px";
    showView.dataset.place = viewleft + "," + viewtop + "," + viewWidth + "," + viewHeight;
};


//关闭预览图
SetUploaderFilesPreview.prototype.closeView = function (closebtn) {
    var self = this;
    closebtn.onclick = function () {

        self.enableMove();
        var showView = document.querySelector(".showView");
        var place = showView.dataset.place.split(",");
        showView.style.left = place[0] + "px";
        showView.style.top = place[1] + "px";
        showView.style.width = place[2] + "px";
        showView.style.height = place[3] + "px";
        showView.classList.add("thisviewclose");
        setTimeout(function () {
            showView.parentNode.removeChild(showView);
        }, 600);

        closebtn.onclick = null;
    };
};


//错误放置处
SetUploaderFilesPreview.prototype.createErrorTips = function () {
    var self = this;
    if (!document.querySelector(".errortips")) {
        var errorTips = document.createElement("div");
        errorTips.className = "errortips";
        self.target.appendChild(errorTips);
    }

    return !!errorTips ? errorTips : document.querySelector(".errortips");
};

//错误小提示dom
SetUploaderFilesPreview.prototype.createLitTip = function (text, _class) {
    var self = this;
    var litTip = document.createElement("span");
    litTip.className = "litTip";
    litTip.innerText = text;
    var deltip = document.createElement("em");
    deltip.className = "deltip";
    if (typeof _class != "undefined") {
        litTip.classList.add(_class);
    }
    litTip.appendChild(deltip);
    self.createErrorTips().appendChild(litTip);
    self.deleteTheOneTip(deltip);
    return litTip;
};


//删除图片同时删除对应一条错误提示
SetUploaderFilesPreview.prototype.deleteOneTip = function (_errorDom) {
    if (!_errorDom.parentNode) return;

    var tamptime = 300;


    _errorDom.style.cssText = "opacity:0;transition: opacity " + tamptime + "ms;-webkit-transition:opacity " + 2000 + "ms";
    setTimeout(function () {
        _errorDom.parentNode.removeChild(_errorDom);
    }, tamptime);

};

//点击错误提示的指定删除按钮删除指定错误信息
SetUploaderFilesPreview.prototype.deleteTheOneTip = function (delbtn) {
    var tamptime = 300;
    delbtn.onclick = function () {
        var self = this;
        this.parentNode.style.cssText = "opacity:0;transition: opacity " + tamptime + "ms;-webkit-transition:opacity " + 2000 + "ms";
        setTimeout(function () {
            self.parentNode.parentNode.removeChild(self.parentNode);
        }, tamptime)


    }
};


//上传进度
SetUploaderFilesPreview.prototype.progress = function (xhr, _extend) {
    var self = this;
    var up = self.target;
    if (!up.querySelector(".progressView")) {
        var progressView = document.createElement("div");
        progressView.className = "progressView";
    }
    progressView = progressView ? progressView : up.querySelector(".progressView");
    xhr.upload.addEventListener("progress", function (event) {
        if (typeof _extend == "function") {
            _extend(event, xhr);
        } else {
            up.appendChild(progressView);
            var upH = up.clientHeight;
            var inittop = 0;
            if (event.lengthComputable) {
                var percentage = (event.loaded * 100) / event.total;
                progressView.innerHTML = percentage.toFixed(2) + "%";
                //progressView.style.transform = "translate3d(0," + upH * percentage/100 + "px,0)";
                //progressView.style.transition = "all 1s";
                progressView.style.top = upH * percentage / 100 + "px";
                if (percentage == 100) {
                    self._evloaded = true;
                }
            }
        }
    }, false)
};


//上传结束
SetUploaderFilesPreview.prototype.loaded = function (xhr, _extend) {
    var self = this;
    var up = self.target;
    xhr.upload.addEventListener("load", function (event) {
        if (typeof _extend == "function") {
            _extend(event, xhr)
        } else {
            if (event.lengthComputable) {
                var isloadedDOM = Array.prototype.slice.call(up.querySelectorAll(".fileloaded"));
                for (var i = 0; i < isloadedDOM.length; i++) {
                    if (!isloadedDOM[i].parentNode.classList.contains("fileError")) {
                        isloadedDOM[i].innerHTML = "yes"
                    }

                }
                if (self._evloaded == true) {
                    if (up.querySelector(".progressView")) {
                        var view = document.querySelector(".progressView");
                        view.parentNode.removeChild(view);
                    }
                    self._evloaded = false;
                }

            }
        }
    })
};


//上传出错
SetUploaderFilesPreview.prototype.error = function (xhr, _extend) {
    var self = this;
    xhr.upload.addEventListener("error", function (error) {
        if (typeof _extend == "function") {
            _extend(error, xhr)
        } else {
            if (error) {
                alert("error:" + error)
            }
        }
    })
};


//文件大小提示
SetUploaderFilesPreview.prototype.fileInfo = function (uploadFiles, _file) {
    var self = this;
    var fileTip = document.createElement("span");
    fileTip.className = "fileTip";
    fileTip.innerText = _file.size / 1024 / 1024 >= 1 ? (_file.size / 1024 / 1024).toFixed(2) + "MB" : (_file.size / 1024).toFixed(2) + "KB";
    uploadFiles.appendChild(fileTip);
};


//文件拖拽
//进入
SetUploaderFilesPreview.prototype.fileDragEnter = function () {
    var self = this;
    var filesPreview = self.target;
    filesPreview.addEventListener("dragenter", function (event) {
        event.stopPropagation();
        event.preventDefault();

        filesPreview.classList.add("filedragenter");
    }, false)

};


//过滤，将过滤的方法总结起来,,在原来的判断基础上，支持扩展，扩展必须返回一个允许的数组，否则会报错
SetUploaderFilesPreview.prototype.filterFiles = function (self, allFiles, exFilter) {


    //判断类型
    if (!self.allowedType.call(self, allFiles)) {
        return false;
    }

    //判断扩展名
    if (!self.allowedFileExtensions.call(self, allFiles)) {
        return false;
    }

    //判断同名
    var newDragFiles = self.sameFileHere(self, allFiles);


    //判断总文件大小
    if (!self.ifFilesTooBig.call(self, allFiles)) {
        return false;
    }


    //判断文件总数
    if (!self.allowedNumber.call(self, allFiles)) {
        return false;
    }

    //判断单个文件大小
    for (var _file = 0; _file < allFiles.length; _file++) {
        -function (file) {
            self.ifFileTooBig.call(self, file);
        }(allFiles[_file])
    }


    var newFiles = [];

    exFilter = self.opts.exFilter;

    if (typeof exFilter == "function") {
        if (!Array.isArray(exFilter(allFiles))) {
            throw new Error("Callback need return a data with type of array.");
        } else {
            newFiles = exFilter(allFiles);
        }
    } else {
        newFiles = newDragFiles;
    }

    return newFiles;
};

//获取目标dom
SetUploaderFilesPreview.prototype.getTargetDOM = function (_self) {
    return _self.target;
};

//dragover  不对drogover进行preventdefault。drop事件无法触发，，并且还要return，不然浏览器会奔溃
SetUploaderFilesPreview.prototype.fileDragEnter = function () {
    var self = this;
    var filesPreview = self.getTargetDOM(self);
    filesPreview.addEventListener("dragover", function (event) {
        event.stopPropagation();
        event.preventDefault();
        return false;
    }, false)
};

//文件拖拽
//出去drag
SetUploaderFilesPreview.prototype.fileDragLeave = function () {
    var self = this;
    var filesPreview = self.getTargetDOM(self);
    filesPreview.addEventListener("dragleave", function (event) {
        event.preventDefault();
        event.stopPropagation();
        filesPreview.classList.remove("filedragenter");
    }, false)
};


//文件拖拽
//放入
SetUploaderFilesPreview.prototype.fileDrop = function () {
    var self = this;
    var filesPreview = self.getTargetDOM(self);
    filesPreview.addEventListener("drop", function (event) {
        event.stopPropagation();
        event.preventDefault();
        var dragFiles = Array.prototype.slice.call(event.dataTransfer.files);

        newDragFiles = self.singleUpload(dragFiles);

        var newDragFiles = self.filterFiles(self, dragFiles);

        if (!newDragFiles) {
            return false;
        }

        for (var _file = 0; _file < newDragFiles.length; _file++) {
            self.putFilesZone(newDragFiles[_file], filesPreview);
        }

    }, false)

};


var browser={
    versions:function(){
        var u = navigator.userAgent;
        var app = navigator.appVersion;
        return {//移动终端浏览器版本信息
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
            iPhone: u.indexOf('iPhone') > -1 , //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
        };
    }(),
    language:(navigator.browserLanguage || navigator.language).toLowerCase()
}




//拖拽图片，排列图片位置，为所有图片重新创建新的排列顺序，排列索引为新的键保存
SetUploaderFilesPreview.prototype.filePosChange = function (file) {
    //保存在对象里的指向的当前文件的dom指针
    var uploadfile = file.uploadFile;
    uploadfile.files = this.files;
    uploadfile.file = file;
    uploadfile.constru = this;

    //图片的相对父级，获取定位用的
    uploadfile.offSetP = this.target;

    if(browser.versions.mobile || browser.versions.ios || browser.versions.android || browser.versions.iPhone || browser.versions.iPad){
        uploadfile.startevent = "touchstart";
        uploadfile.moveevent = "touchmove";
        uploadfile.endevent = "touchend";
    } else {
        uploadfile.startevent = "mousedown";
        uploadfile.moveevent = "mousemove";
        uploadfile.endevent = "mouseup";
    }

    uploadfile.addEventListener(uploadfile.startevent, filePosChangeStart, false);
};



//图片位置开始移动
function filePosChangeStart(event) {

    //防止用户在可多点触控设备上同时移动当前实例内的两个文件
    //alert(event.touches.length);
    if(this.startevent == "touchstart" && event.touches.length > 1) {
        return;
    }
    /****/

    var constru = this.constru;
    if(constru.posingFile) {
        filePosChangeEnd.call(constru.posingFile);
        return;
    } else {
        constru.posingFile = this;
    }

    var file = this.file;
    var self = this;
    var uploadfile = file.uploadFile;

    //图片域父级的相对屏幕位置
    var parentOffSet = this.offSetP.getBoundingClientRect();
    var posObj = {};
    posObj.pOffL = parentOffSet.left;
    posObj.pOffT = parentOffSet.top;
    var touches = event.targetTouches ? event.targetTouches : event;
    var posOff = uploadfile.getBoundingClientRect();
    if (touches.length == 1 || !touches.length) {
        var fileCss = window.getComputedStyle(uploadfile, null);
        var fileMarginTop = parseFloat(fileCss.marginTop.match(/(\d*)[^\d]*/)[1]);
        var fileMarginLeft = parseFloat(fileCss.marginLeft.match(/(\d*)[^\d]*/)[1]);
        var touch = touches[0] ? touches[0] : event;
        posObj.fileMarginLeft = fileMarginLeft;
        posObj.fileMarginTop = fileMarginTop;
        posObj.offL = uploadfile.offsetLeft;
        posObj.offT = uploadfile.offsetTop;
        posObj.pointerx = touch.clientX;//触点位置x
        posObj.pointery = touch.clientY;//触点位置y
        posObj.elex = posOff.left;//该file与屏幕左边距
        posObj.eley = posOff.top;//该file与屏幕上边距
        posObj.distancex = posObj.pointerx - posObj.elex;//触点和file左边距距离
        posObj.distancey = posObj.pointery - posObj.eley;//触点和file上边距距离
        self.posObj = posObj;
        uploadfile.posObj = posObj;
        uploadfile.filesPosArr = getFilePos.call(this);


        uploadfile.addEventListener(this.moveevent, filePosChangeMove, false);
        uploadfile.addEventListener(this.endevent, filePosChangeEnd, false);

    }
};

//图片位置移动中
function filePosChangeMove(event) {
    event.preventDefault();
    var posObj = this.posObj;
    var uploadfile = this;

    uploadfile.style.transform = "scale(1.2, 1.2)";
    uploadfile.style.webkitTransform = "scale(1.2, 1.2)";

    uploadfile.style.transition = "all 0s";
    uploadfile.style.webkitTransition = "all 0s";

    var touches = event.targetTouches ? event.targetTouches : event;
    var posOff = uploadfile.getBoundingClientRect();
    if (touches.length == 1 || !touches.length) {
        var touch = touches[0] ? touches[0] : event;
        posObj.pointerx = touch.clientX;
        posObj.pointery = touch.clientY;
        uploadfile.style.left = posObj.pointerx - posObj.pOffL - posObj.distancex + "px";
        uploadfile.style.top = posObj.pointery - posObj.pOffT - posObj.distancey + "px";
    }
    this.posObj = posObj;

    //filesPosAni.call(this);
};

//图片拖动结束
function filePosChangeEnd() {

    this.removeEventListener(this.moveevent, filePosChangeMove, false);
    this.removeEventListener(this.endevent, filePosChangeEnd, false);


    var constru = this.constru;
    setTimeout(function() {
        constru.posingFile = null;
    }, 300);


    var file = this.file;
    var posObj = this.posObj;
    var uploadfile = this;
    var self = this;
    var files = self.files;
    var fileMarginLeft = posObj.fileMarginLeft;
    var fileMarginTop = posObj.fileMarginTop;
    var filesPosArr = this.filesPosArr;

    uploadfile.style.transform = "scale(1, 1)";
    uploadfile.style.webkitTransform = "scale(1, 1)";

    var elex, eley;
    var posOff = uploadfile.getBoundingClientRect();
    elex = posObj.pointerx - posObj.distancex;
    eley = posObj.pointery - posObj.distancey;
    var intoIndex;
    var towards;
    var chfileIndex = files.indexOf(file);
    filesPosArr.forEach(function (item, index) {

        var itemfile = item.uploadFile;
        itemfile.style.transition = "all 0.3s";
        itemfile.style.webkitTransition = "all 0.3s";

        //如果当前图片移动后位置移动到了确定位置，就插到符合条件的图片的后面。
        var nextItem = filesPosArr[index];
        if (elex >= item.posL && elex <= item.posR && eley >= item.posT && eley <= item.posB) {

            intoIndex = index;
            if (chfileIndex >= index) {
                towards = "forwards";
            } else {
                towards = "backwards";
            }

            //如果符合条件的位置刚好是自己本身
            if (itemfile == uploadfile) {
                uploadfile.style.left = posObj.offL - fileMarginLeft + "px";
                uploadfile.style.top = posObj.offT - fileMarginTop + "px";
                return;
            }
            /*****/
            uploadfile.style.position = "absolute";
            uploadfile.style.left = nextItem.offL - fileMarginLeft + "px";
            uploadfile.style.top = nextItem.offT - fileMarginTop + "px";

        }
    });


    //如果符合条件的位置刚好是自己本身
    if (intoIndex == undefined) {
        uploadfile.style.left = posObj.offL - fileMarginLeft + "px";
        uploadfile.style.top = posObj.offT - fileMarginTop + "px";
        return;
    }
    /*****/

    var chfile = self.files.splice(chfileIndex, 1)[0];
    if (chfileIndex >= intoIndex) {
        _posChange(intoIndex, chfileIndex, "forwards");
        files.splice(intoIndex, 0, chfile);
    } else {
        _posChange(++chfileIndex, ++intoIndex, "backwards");
        files.splice(intoIndex - 1, 0, chfile);
    }



    function _posChange(index1, index2, towards) {
        var startfile;
        var nextitem;
        var tfile;
        for (startfile = index1; startfile < index2; startfile++) {
            tfile = filesPosArr[startfile];
            if (towards == "forwards") {
                nextitem = filesPosArr[startfile + 1]
            } else if (towards == "backwards") {
                nextitem = filesPosArr[startfile - 1]
            }
            tfile.uploadFile.style.left = nextitem.offL - fileMarginLeft + "px";
            tfile.uploadFile.style.top = nextitem.offT - fileMarginTop + "px";
        }

    }


    if(typeof constru.afterFilesPosChange == "function") {
        constru.afterFilesPosChange(files);
    }


}


//图片排列规则和排列动画
function filesPosAni() {
    var file = this.file;
    var posObj = this.posObj;
    var uploadfile = this;
    var self = this;
    var files = self.files;
    var fileMarginLeft = posObj.fileMarginLeft;
    var fileMarginTop = posObj.fileMarginTop;
    var filesPosArr = this.filesPosArr;

    var elex, eley;
    var posOff = uploadfile.getBoundingClientRect();
    elex = posObj.pointerx - posObj.distancex;
    eley = posObj.pointery - posObj.distancey;
    var intoIndex;
    var towards;
    var chfileIndex = files.indexOf(file);
    filesPosArr.forEach(function (item, index) {
        var itemfile = item.uploadFile;
        if (itemfile != uploadfile) {
            itemfile.style.transition = "all 0.3s";
            itemfile.style.webkitTransition = "all 0.3s";
        }


        //如果当前图片移动后位置移动到了确定位置，就插到符合条件的图片的后面。
        var nextItem = filesPosArr[index];
        if (elex >= item.posL && elex <= item.posR && eley >= item.posT && eley <= item.posB) {

            intoIndex = index;
            if (chfileIndex >= index) {
                towards = "forwards";
            } else {
                towards = "backwards";
            }

        }
    });

    if(intoIndex == undefined) {
        return
    }


    var chfile = self.files.splice(chfileIndex, 1)[0];
    if (chfileIndex >= intoIndex) {
        _posChange(intoIndex, chfileIndex, "forwards");
        console.log("forwards");
        files.splice(intoIndex, 0, chfile);
    } else {
        console.log("backwards");
        _posChange(++chfileIndex, ++intoIndex, "backwards");
        files.splice(intoIndex - 1, 0, chfile);
    }



    function _posChange(index1, index2, towards) {
        var startfile;
        var nextitem;
        var tfile;
        for (startfile = index1; startfile < index2; startfile++) {
            tfile = filesPosArr[startfile];
            if (towards == "forwards") {
                nextitem = filesPosArr[startfile + 1]
            } else if (towards == "backwards") {
                nextitem = filesPosArr[startfile - 1]
            }
            tfile.uploadFile.style.left = nextitem.offL - fileMarginLeft + "px";
            tfile.uploadFile.style.top = nextitem.offT - fileMarginTop + "px";
        }

    }
}


//获取当前文件域内所有图片dom的左边距和上边距。
function getFilePos() {
    var self = this;
    var files = this.files;
    var posObj = this.posObj;
    //把当前触摸的file排除
    var filearr = files.map(function (item) {
        var uploadfile = item.uploadFile;
        var offL = uploadfile.offsetLeft;
        var offT = uploadfile.offsetTop;
        var filePos = uploadfile.getBoundingClientRect();

        return {
            uploadFile: uploadfile,
            posL: filePos.left,
            posT: filePos.top,
            posR: filePos.right,
            posB: filePos.bottom,
            offL: offL,
            offT: offT
        }
    });

    filearr.forEach(function (item) {
        var itemfile = item.uploadFile;
        itemfile.style.left = item.offL - posObj.fileMarginLeft + "px";
        itemfile.style.top = item.offT - posObj.fileMarginTop + "px";
        itemfile.style.position = "absolute";
        itemfile.style.zIndex = "99";
        itemfile.style.transition = "all 0s";
        itemfile.style.webkitTransition = "all 0s";
        if(itemfile == self) {
            itemfile.style.zIndex = "100";
        }
    });

    return filearr;
};

function prevent(event) {
    event.preventDefault();
}