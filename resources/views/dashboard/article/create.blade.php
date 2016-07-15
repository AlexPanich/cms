@extends('layouts.dashboard')

@include('dashboard.editor')

@section('content')
    <h3>Создать статью</h3>
    <hr>
    @include('errors.list')

    <form action="{{ route('add_article') }}" method="post" enctype="multipart/form-data">
        {{ csrf_field() }}
        <div class="form-group">
            <label class="form-label" for="title">Название</label>
            <input class="form-control" type="text" name="title" id="title" value="{{ old('title') }}">
        </div>
        <div class="form-group">
            <label class="form-label" for="preview">Название</label>
            <input class="form-control" type="file" name="preview" id="preview" value="{{ old('preview') }}">
        </div>
        <div class="form-group">
            <label class="from-label" for="text">Текст</label>
            <textarea class="form-control" name="text" id="text" rows="10">{{ old('text') }}</textarea>
        </div>
        <button class="btn btn-primary" type="submit">Создать статью</button>
    </form>
@endsection
