# fileLoader
file控件，文件上传
```javascript
var file = new SetUploaderFilesPreview({
        resource: ".file",
        target: ".d1",
        num: 9,
        size: 1024 * 1024 * 4,
        allowedType: ["image"],
        allowedExtensions: ["jpg", "png"],
        multi: true,
        drag: true,
        bigView: true,
        openFileChangePos: true,
        afterFilesPosChange: function(files) {
            console.log(files)
        }
    });
    
```

# params
## opts
- ``` resource:  file类型的元素  .类名或 #id********  必须 ```
- ``` target:  放置预览图区域,类名或 #id********  可选 ```
- ``` fullSize:  总文件尺寸大小********  默认不限制 ```
- ``` size:  单文件尺寸大小限制********   默认不限制 ```
- ```num:  上传最大文件总数********  默认不限制 ```
- ``` allowedType: 限制文件类型```
- ```allowedExtensions:   限制文件扩展名```
- ```drag:  是否允许拖拽  （true时可拖拽）```
- ```exFilter: 方法，扩展的过滤器，必须返回一个数组，否则会报错```
- ```bigView:  是否允许用户放大图片```
- ```multi:  true允许多图，如果不指定这个属性即使file写了multiple属性也不允许多图```
- ``` immediately:图片添加成功立即执行的方法，比如ajax上传(有错误信息无法上传) params { _file:当前文件 files：当前实例内的所有符合规定的文件}```
- ``` aftercancel: 点击删除，删除单张图片的时候触发的方法. params {_file:删除的当前文件的相关信息}```
- ```aftercancelAll:点击删除，删除当前实例内所有图片时触发的方法```
- ```fileErrorFun:当前文件如果太大没有完成上传，那没会执行到这个函数，params{file：文件太大而无法完成上传的目前单个文件。是个文件对象。}```
- ```openFileChangePos: 是否开启图片可拖动进行位置排序（true表示开启），排序对页面显示进行调整。同时对实例的files数组也会调整为对应顺序。```
- ```afterFilesPosChange: 重新排序后执行的方法。如果openFileChangePos ！= true 那么这个将会无效。参数为重新排序后的实例的files数组。```



```javascript
//修改文件上传中的样式控制，不修改会应用控件自带的样式。样式包括上传进度监控，上传失败成功监控
function upfile(file, constru, upfilename, tar1, tar2, btn) {

    var xhr = new XMLHttpRequest();
    xhr.open("post", "" + upfilename, true);
    var formdata = new FormData();
    formdata.append(upfilename, file);
    var fileClass = ".uploadFiles" + file.index;
    var tp = document.querySelector(tar2).querySelector(fileClass);
    var progressView;
    //xhr.setRequestHeader("Content-Type","multipart/form-data");

    if (!tp.querySelector(".progressView")) {
        progressView = document.createElement("div");
        progressView.className = "progressView";
        tp.appendChild(progressView);
    }
    progressView = progressView ? progressView : tp.querySelector(".progressView");
    var upH = Math.ceil(progressView.clientWidth) + 1;

    var rounding = roundLoading(progressView);
    dragImgs(tar2, tar2 + " .uploadfiles", 10, btn);
    constru.progress(xhr, function (event, xhr) {


        if (event.lengthComputable) {

            var percentage = (event.loaded * 100) / event.total;
            if (percentage > 99) {
                percentage = 99;
            }
            //progressView.innerHTML = Math.ceil(percentage) + "%";
            rounding(percentage / 100);
            // progressView.style.left = Math.ceil(upH * percentage / 100) + "px";

        }
    });

    constru.error(xhr, function (event, xhr) {
        progressView.style.top = "100%";
        tp.querySelector(".cancelfile").value = "失败";
    })

    constru.loaded(xhr, function (event, xhr) {
        if (event.lengthComputable) {
            tp.querySelector(".fileloaded").innerHTML = "YES";
            console.log(xhr.response);
            //dragImgs(tar2,  tar2 + " .uploadfiles", 10, btn);

        }
    });
    xhr.send(formdata);


    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var res;
            tp.querySelector(".cancelfile").classList.add("cancelfile2");
            try {
                res = JSON.parse(xhr.responseText);
            } catch (e) {
                tp.querySelector(".cancelfile").value = "失败";
                tp.querySelector(".cancelfile").style.color = "#ff0000";
            }

            if (res.state) {
                if (res.state == "SUCCESS") {
                    var sort = constru.files.indexOf(file);
                    //imgarr.push({img: res.url, sort: sort, index: file.index});
                    file.imgurl = res.url;
                    file.sort = sort;
                    tp.setAttribute("sort", sort);
                    var imgarr = constru.files.map(function(file) {
                        return {
                            img: file.imgurl,
                            sort: file.sort,
                            index: file.index
                        }
                    });
                    //imgarr = sortByKey(imgarr, "sort");
                    document.querySelector(tar1).value = JSON.stringify(imgarr);

                    tp.querySelector("img").dataset.src = res.url;
                    //progressView.innerHTML = "100%";
                    //progressView.style.opacity = "0";
                    var imgneed = new Image();
                    imgneed.src = res.url;
                    imgneed.onload = function () {
                        rounding(1, function (canvas) {
                            progressView.style.opacity = "0";
                            setTimeout(function () {
                                progressView.style.display = "none";
                            }, 300);
                            canvas.parentNode.removeChild(canvas);
                        });
                    }
                } else {
                    tp.querySelector(".cancelfile").value = "失败";
                    tp.querySelector(".cancelfile").style.color = "#ff0000";
                }
            }


        }
    }

}
```
