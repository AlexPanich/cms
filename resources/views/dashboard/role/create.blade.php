@extends('layouts.dashboard')

@inject('permission', 'App\Permission')

@section('page_title')
    Роли
@endsection

@section('content_title')
    Создание роли
@endsection

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_role') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name" value="{{ old('name') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="label">Описание</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="label" id="label" value="{{ old('label') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="permissions">Привелегии</label>
            <div class="controls">
                <div class="input-prepend">
                    <select name="permissions[]" id="permissions" multiple>
                        @foreach($permission::all() as $permission)
                            <option value="{{ $permission->id }}"
                            @if(in_array($permission->id, old('permission', [])))
                                selected
                            @endif
                            >{{ $permission->label }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
        </div>
        <br>
        <p>
            <input type="submit" value="Создать роль" class="btn btn-primary btn-square">
            <a class="btn btn-default btn-square" href="{{ route('all_roles') }}">Все роли (уйти не сохранив)</a>
        </p>
    </form>
@endsection