@extends('layouts.dashboard')

@section('page_title')
    Галереи
@endsection

@section('content_title')
    Список галерей
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_gallery') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Имя в системе (КОРОТКОЕ)</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name" value="{{ old('name') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title') }}">
                </div>
            </div>
        </div>
        <br>
        <p>
            <input type="submit" value="Создать галлерею" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('gallery') }}">Все галлереи (уйти не сохранив)</a>
        </p>
    </form>
@endsection