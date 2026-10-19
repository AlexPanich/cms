<div class="row">
    @foreach($gallery->withImage() as $image)
        <div class="col-md-3"><a href="{{ URL::to($image->path) }}"><img src="{{ URL::to($image->thumbnail_path) }}" alt=""></a></div>
    @endforeach
</div>